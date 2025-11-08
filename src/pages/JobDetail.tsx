import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, MapPin, Clock, Award, Leaf, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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
  const [job, setJob] = useState<MicroJob | null>(null);
  const [training, setTraining] = useState<TrainingModule | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobData();
    }
  }, [id]);

  const fetchJobData = async () => {
    try {
      // Fetch job
      const { data: jobData, error: jobError } = await supabase
        .from("micro_jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch training module
      const { data: trainingData, error: trainingError } = await supabase
        .from("training_modules")
        .select("*")
        .eq("microjob_id", id)
        .limit(1)
        .single();

      if (trainingError) throw trainingError;
      setTraining(trainingData);

      // Fetch quiz questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("training_module_id", trainingData.id);

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error) {
      console.error("Error fetching job data:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = () => {
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
    if (!job) return;

    setIsCompleting(true);
    try {
      const { error } = await supabase.from("job_completions").insert({
        microjob_id: job.id,
        quiz_score_percent: score,
        earned_credits: job.reward_credits,
        estimated_co2_kg_impact: job.estimated_co2_kg_impact,
      });

      if (error) throw error;

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
          <p>Job not found</p>
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
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="font-medium">{job.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                    <div className="font-medium">{job.estimated_duration_minutes} min</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-warning" />
                  <div>
                    <div className="text-xs text-muted-foreground">Reward</div>
                    <div className="font-medium">{job.reward_credits} credits</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-success" />
                  <div>
                    <div className="text-xs text-muted-foreground">CO₂ Impact</div>
                    <div className="font-medium">{job.estimated_co2_kg_impact} kg</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Module */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Learning</CardTitle>
              <CardDescription>Complete this training before taking the quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-foreground">{training.content}</div>
              </div>

              {training.learning_objectives && training.learning_objectives.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Learning Objectives:</h4>
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
              <CardTitle className="text-2xl">Knowledge Quiz</CardTitle>
              <CardDescription>
                Pass with 60% or higher to complete this micro-job
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    disabled={showResults}
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
                  Submit Quiz
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
                            <span className="font-medium">Passed! You can complete this job.</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">
                              Not quite there. Review the training and try again.
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
                          Completing Job...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          Complete Job & Earn {job.reward_credits} Credits
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
                      Retry Quiz
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
