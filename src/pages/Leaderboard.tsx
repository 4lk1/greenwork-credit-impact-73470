import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Target, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  topic: string;
  score: number;
  total_questions: number;
  percentage: number;
  difficulty: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

interface UserStats {
  total_quizzes: number;
  average_score: number;
  best_score: number;
  rank: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [recentScores, setRecentScores] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch top scores with profiles
      const { data: topData } = await supabase
        .from("quiz_scores")
        .select("*")
        .order("percentage", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent scores with profiles
      const { data: recentData } = await supabase
        .from("quiz_scores")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch profiles for top scores
      if (topData) {
        const userIds = topData.map(s => s.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const enrichedTop = topData.map(score => ({
          ...score,
          profiles: profilesMap.get(score.user_id) || { username: "Anonymous", avatar_url: null }
        }));
        setTopScores(enrichedTop as any);
      }

      // Fetch profiles for recent scores
      if (recentData) {
        const userIds = recentData.map(s => s.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const enrichedRecent = recentData.map(score => ({
          ...score,
          profiles: profilesMap.get(score.user_id) || { username: "Anonymous", avatar_url: null }
        }));
        setRecentScores(enrichedRecent as any);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data: scores } = await supabase
        .from("quiz_scores")
        .select("*")
        .eq("user_id", user.id);

      if (scores && scores.length > 0) {
        const total = scores.length;
        const avgScore = scores.reduce((acc, s) => acc + s.percentage, 0) / total;
        const bestScore = Math.max(...scores.map(s => s.percentage));

        // Get user rank
        const { data: allScores } = await supabase
          .from("quiz_scores")
          .select("user_id, percentage")
          .order("percentage", { ascending: false });

        const userBestScore = Math.max(...scores.map(s => s.percentage));
        const rank = allScores?.filter(s => s.percentage > userBestScore).length || 0;

        setUserStats({
          total_quizzes: total,
          average_score: Math.round(avgScore),
          best_score: Math.round(bestScore),
          rank: rank + 1,
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <Award className="h-5 w-5 text-muted-foreground" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "intermediate": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "advanced": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const LeaderboardSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <div
      key={entry.id}
      className={`flex items-center gap-4 p-4 rounded-lg transition-smooth hover:bg-accent/50 ${
        entry.user_id === user?.id ? "bg-primary/5 border border-primary/20" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-[50px]">
        {getRankIcon(index)}
        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
      </div>

      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
        <AvatarImage src={entry.profiles.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
          {entry.profiles.username?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">
          {entry.profiles.username}
          {entry.user_id === user?.id && (
            <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
          )}
        </p>
        <p className="text-sm text-muted-foreground truncate">{entry.topic}</p>
      </div>

      <div className="flex items-center gap-3">
        <Badge className={getDifficultyColor(entry.difficulty)}>
          {entry.difficulty}
        </Badge>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{Math.round(entry.percentage)}%</p>
          <p className="text-xs text-muted-foreground">
            {entry.score}/{entry.total_questions}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8 space-y-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Trophy className="h-4 w-4" />
            Leaderboard
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Top Performers
          </h1>
          <p className="text-muted-foreground">
            See how you stack up against other sustainability learners
          </p>
        </div>

        {user && userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
            <Card className="gradient-card hover:shadow-medium transition-smooth">
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{userStats.total_quizzes}</p>
                <p className="text-sm text-muted-foreground">Quizzes Taken</p>
              </CardContent>
            </Card>
            <Card className="gradient-card hover:shadow-medium transition-smooth">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{userStats.average_score}%</p>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </CardContent>
            </Card>
            <Card className="gradient-card hover:shadow-medium transition-smooth">
              <CardContent className="pt-6 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{userStats.best_score}%</p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </CardContent>
            </Card>
            <Card className="gradient-card hover:shadow-medium transition-smooth">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">#{userStats.rank}</p>
                <p className="text-sm text-muted-foreground">Global Rank</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="gradient-card border-2 shadow-large">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Leaderboard Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="top" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="top" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Top Scores
                </TabsTrigger>
                <TabsTrigger value="recent" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="top" className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  {isLoading ? (
                    <LeaderboardSkeleton />
                  ) : topScores.length > 0 ? (
                    <div className="space-y-2">
                      {topScores.map((entry, index) => renderLeaderboardEntry(entry, index))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No quiz scores yet. Be the first!</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="recent" className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  {isLoading ? (
                    <LeaderboardSkeleton />
                  ) : recentScores.length > 0 ? (
                    <div className="space-y-2">
                      {recentScores.map((entry, index) => renderLeaderboardEntry(entry, index))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent quiz activity</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
