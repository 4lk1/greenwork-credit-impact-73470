import { Navigation } from "@/components/Navigation";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, MapPin, Clock, Award, Leaf, CheckCircle2, AlertCircle, Save, LogIn } from "lucide-react";
import { toast } from "sonner";
import { ChatWidget } from "@/components/ChatWidget";
import { useLanguage } from "@/contexts/LanguageContext";

interface MicroJob {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  estimated_duration_minutes: number;
  reward_credits: number;
  estimated_co2_kg_impact: number;
  location: string;
}

interface TrainingModule {
  id: string;
  title: string;
  content: string;
  learning_objectives: string[];
}

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [job, setJob] = useState<MicroJob | null>(null);
  const [training, setTraining] = useState<TrainingModule | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      fetchJobData();
    }
  }, [id]);

  // Auto-save answers when they change
  useEffect(() => {
    if (progressId && Object.keys(answers).length > 0 && !showResults) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, 1000); // Save after 1 second of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers, progressId, showResults]);

  const fetchJobData = async () => {
    try {
      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from("micro_jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (jobError) throw jobError;
      
      if (!jobData) {
        toast.error("Job not found");
        setLoading(false);
        return;
      }
      
      setJob(jobData);

      // Fetch training module
      const { data: trainingData, error: trainingError } = await supabase
        .from("training_modules")
        .select("*")
        .eq("microjob_id", id)
        .limit(1)
        .maybeSingle();

      if (trainingError) throw trainingError;
      
      if (!trainingData) {
        toast.error("Training module not found");
        setLoading(false);
        return;
      }
      
      setTraining(trainingData);

      // Fetch quiz questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("training_module_id", trainingData.id);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Load existing progress only if user is logged in
      if (user) {
        const { data: progressData } = await supabase
          .from("job_progress")
          .select("*")
          .eq("microjob_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (progressData) {
          setProgressId(progressData.id);
          setAnswers((progressData.quiz_answers as Record<string, string>) || {});
          setLastSaved(new Date(progressData.updated_at));
          toast.success("Progress restored", {
            description: "Your previous answers have been loaded.",
          });
        } else {
          // Create new progress record
          const { data: newProgress, error: progressError } = await supabase
            .from("job_progress")
            .insert({
              microjob_id: id,
              user_id: user.id,
              quiz_answers: {},
            })
            .select()
            .single();

          if (!progressError && newProgress) {
            setProgressId(newProgress.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching job data:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!progressId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("job_progress")
        .update({
          quiz_answers: answers,
        })
        .eq("id", progressId);

      if (error) throw error;
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitQuiz = () => {
    if (!user) {
      toast.error("Please log in to submit the quiz");
      navigate("/auth");
      return;
    }

    let correctAnswers = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        correctAnswers++;
      }
    });

    const scorePercent = Math.round((correctAnswers / questions.length) * 100);
    setScore(scorePercent);
    setShowResults(true);
  };

  const handleCompleteJob = async () => {
    if (!job || !user) return;

    setIsCompleting(true);
    try {
      const { error } = await supabase.from("job_completions").insert({
        user_id: user.id,
        microjob_id: job.id,
        quiz_score_percent: score,
        earned_credits: job.reward_credits,
        estimated_co2_kg_impact: job.estimated_co2_kg_impact,
      });

      if (error) throw error;

      // Delete progress record after completion
      if (progressId) {
        await supabase.from("job_progress").delete().eq("id", progressId);
      }

      toast.success("Congratulations! Job completed successfully!", {
        description: `You earned ${job.reward_credits} credits and offset ${job.estimated_co2_kg_impact} kg CO₂!`,
      });

      setTimeout(() => {
        navigate("/impact");
      }, 2000);
    } catch (error) {
      console.error("Error completing job:", error);
      toast.error("Failed to complete job");
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!job || !training) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>{t("jobDetail.jobNotFound")}</p>
        </div>
      </div>
    );
  }

  const isPassing = score >= 60;
  const allQuestionsAnswered = questions.every((q) => answers[q.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Job Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="border-primary/20 text-primary">
                  {job.category.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </Badge>
                <Badge variant="outline">{job.difficulty_level}</Badge>
              </div>
              <CardTitle className="text-3xl">{job.title}</CardTitle>
              <CardDescription className="text-base">{job.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t("jobDetail.location")}</div>
                    <div className="font-medium">{job.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t("jobDetail.duration")}</div>
                    <div className="font-medium">{job.estimated_duration_minutes} {t("jobDetail.min")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-warning" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t("jobDetail.reward")}</div>
                    <div className="font-medium">{job.reward_credits} {t("jobs.credits")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-success" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t("jobDetail.co2Impact")}</div>
                    <div className="font-medium">{job.estimated_co2_kg_impact} {t("jobDetail.kg")}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Module */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("jobDetail.learning")}</CardTitle>
              <CardDescription>{t("jobDetail.learningDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-foreground">{training.content}</div>
              </div>

              {training.learning_objectives && training.learning_objectives.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">{t("jobDetail.learningObjectives")}</h4>
                  <ul className="space-y-1">
                    {training.learning_objectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{t("jobDetail.knowledgeQuiz")}</CardTitle>
                  <CardDescription>
                    {t("jobDetail.quizDesc")}
                  </CardDescription>
                </div>
                {lastSaved && !showResults && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
                    <span>
                      {isSaving ? t("common.saving") : `${t("common.save")} ${new Date(lastSaved).toLocaleTimeString()}`}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!user && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <LogIn className="h-10 w-10 text-primary" />
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Login Required</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          You're viewing as a visitor. Please log in or sign up to take the quiz and earn credits.
                        </p>
                      </div>
                      <Button onClick={() => navigate("/auth")} className="w-full sm:w-auto">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login / Sign Up
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {questions.map((question, index) => (
                <div key={question.id} className="space-y-3">
                  <h4 className="font-medium">
                    {index + 1}. {question.question_text}
                  </h4>
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({ ...prev, [question.id]: value }))
                    }
                    disabled={showResults || !user}
                  >
                    {["a", "b", "c", "d"].map((option) => {
                      const isCorrect = question.correct_option === option;
                      const isSelected = answers[question.id] === option;
                      const showCorrectAnswer = showResults && isCorrect;
                      const showWrongAnswer = showResults && isSelected && !isCorrect;

                      return (
                        <div
                          key={option}
                          className={`flex items-center space-x-2 p-3 rounded-md border ${
                            showCorrectAnswer
                              ? "bg-success/10 border-success"
                              : showWrongAnswer
                              ? "bg-destructive/10 border-destructive"
                              : "border-border"
                          }`}
                        >
                          <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                          <Label
                            htmlFor={`${question.id}-${option}`}
                            className="flex-1 cursor-pointer"
                          >
                            {question[`option_${option}` as keyof QuizQuestion]}
                          </Label>
                          {showCorrectAnswer && (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          )}
                          {showWrongAnswer && (
                            <AlertCircle className="h-5 w-5 text-destructive" />
                          )}
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}

              {!showResults ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={!allQuestionsAnswered}
                  className="w-full"
                  size="lg"
                >
                  {t("jobDetail.submitQuiz")}
                </Button>
              ) : (
                <div className="space-y-4">
                  <Card className={isPassing ? "border-success" : "border-destructive"}>
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="text-4xl font-bold">{score}%</div>
                        <Progress value={score} className="h-2" />
                        {isPassing ? (
                          <div className="flex items-center justify-center gap-2 text-success">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">{t("jobDetail.passed")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">
                              {t("jobDetail.notPassed")}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {isPassing ? (
                    <Button
                      onClick={handleCompleteJob}
                      disabled={isCompleting}
                      className="w-full"
                      size="lg"
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t("jobDetail.completingJob")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          {t("jobDetail.completeJob")} {job.reward_credits} {t("jobs.credits")}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowResults(false);
                        setAnswers({});
                      }}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {t("jobDetail.retryQuiz")}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {job && (
        <ChatWidget 
          context={`page=job_detail; job_title=${job.title}; category=${job.category}; difficulty=${job.difficulty_level}; duration=${job.estimated_duration_minutes} minutes; co2_impact=${job.estimated_co2_kg_impact} kg; reward=${job.reward_credits} credits`}
        />
      )}
    </div>
  );
};

export default JobDetail;
