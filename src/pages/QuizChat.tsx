import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles, BookOpen, Trophy, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const QuizChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI quiz assistant. 🌱 I can create personalized quizzes about sustainability topics! What would you like to learn about today? (e.g., renewable energy, climate change, waste reduction)"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizDifficulty, setQuizDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-quiz-chat`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (resp.status === 429) {
        toast({
          title: "Rate limit exceeded",
          description: "Please wait a moment before sending another message.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (resp.status === 402) {
        toast({
          title: "Service unavailable",
          description: "AI service payment required. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    await streamChat(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveScore = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to save your quiz scores.",
        variant: "destructive",
      });
      return;
    }
    setShowSaveDialog(true);
  };

  const saveQuizScore = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from("quiz_scores").insert({
        user_id: user.id,
        topic: quizTopic,
        score: quizScore,
        total_questions: quizTotal,
        difficulty: quizDifficulty,
      });

      if (error) throw error;

      toast({
        title: "Score saved! 🎉",
        description: `Your score of ${quizScore}/${quizTotal} has been added to the leaderboard.`,
      });

      setShowSaveDialog(false);
      setQuizTopic("");
      setQuizScore(0);
      setQuizTotal(0);
    } catch (error) {
      console.error("Error saving score:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz score. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 space-y-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI-Powered Learning
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Quiz Assistant
          </h1>
          <p className="text-muted-foreground">
            Get personalized sustainability quizzes based on your interests
          </p>
        </div>

        <Card className="gradient-card border-2 shadow-large">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-6" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold text-primary">Quiz Assistant</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-muted rounded-lg p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for a quiz on any sustainability topic..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="gradient-primary"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-medium transition-smooth cursor-pointer" onClick={() => setInput("Create a beginner quiz about renewable energy")}>
            <CardContent className="pt-4 text-center">
              <p className="text-sm font-medium">🌞 Renewable Energy</p>
              <p className="text-xs text-muted-foreground mt-1">Beginner level</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-medium transition-smooth cursor-pointer" onClick={() => setInput("Give me an intermediate quiz on waste reduction")}>
            <CardContent className="pt-4 text-center">
              <p className="text-sm font-medium">♻️ Waste Reduction</p>
              <p className="text-xs text-muted-foreground mt-1">Intermediate level</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-medium transition-smooth cursor-pointer" onClick={() => setInput("Challenge me with an advanced climate change quiz")}>
            <CardContent className="pt-4 text-center">
              <p className="text-sm font-medium">🌍 Climate Change</p>
              <p className="text-xs text-muted-foreground mt-1">Advanced level</p>
            </CardContent>
          </Card>
        </div>

        {user && (
          <Card className="mt-6 gradient-card border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Completed a quiz?</p>
                    <p className="text-sm text-muted-foreground">Save your score to the leaderboard!</p>
                  </div>
                </div>
                <Button onClick={handleSaveScore} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Score
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Save Quiz Score
            </DialogTitle>
            <DialogDescription>
              Enter your quiz details to save your score to the leaderboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Quiz Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Renewable Energy"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score">Your Score</Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quizScore || ""}
                  onChange={(e) => setQuizScore(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Total Questions</Label>
                <Input
                  id="total"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={quizTotal || ""}
                  onChange={(e) => setQuizTotal(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={quizDifficulty} onValueChange={(value: any) => setQuizDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveQuizScore}
              disabled={!quizTopic || !quizScore || !quizTotal}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save to Leaderboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizChat;
