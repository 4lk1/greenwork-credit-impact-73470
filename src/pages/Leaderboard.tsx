import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Target, Calendar, Search, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_credits: number;
  total_co2_impact: number;
  total_jobs: number;
  avg_score: number;
  completed_at: string;
}

interface UserStats {
  total_jobs: number;
  average_score: number;
  best_score: number;
  rank: number;
  total_credits: number;
  total_impact: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
  const [recentScores, setRecentScores] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLeaderboardData();
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch aggregated job completion stats per user for top scores
      const { data: completionsData } = await supabase
        .from("job_completions")
        .select("user_id, quiz_score_percent, earned_credits, estimated_co2_kg_impact, completed_at");

      if (completionsData) {
        // Aggregate by user
        const userStatsMap = new Map<string, {
          total_credits: number;
          total_co2_impact: number;
          total_jobs: number;
          scores: number[];
          last_completed: string;
        }>();

        completionsData.forEach(completion => {
          const existing = userStatsMap.get(completion.user_id) || {
            total_credits: 0,
            total_co2_impact: 0,
            total_jobs: 0,
            scores: [],
            last_completed: completion.completed_at
          };

          existing.total_credits += completion.earned_credits;
          existing.total_co2_impact += parseFloat(completion.estimated_co2_kg_impact.toString());
          existing.total_jobs += 1;
          existing.scores.push(completion.quiz_score_percent);
          
          if (completion.completed_at > existing.last_completed) {
            existing.last_completed = completion.completed_at;
          }

          userStatsMap.set(completion.user_id, existing);
        });

        // Fetch profiles for all users
        const userIds = Array.from(userStatsMap.keys());
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Create leaderboard entries
        const entries: LeaderboardEntry[] = Array.from(userStatsMap.entries()).map(([userId, stats]) => {
          const profile = profilesMap.get(userId) || { username: "Anonymous", avatar_url: null };
          const avgScore = stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length;

          return {
            id: userId,
            user_id: userId,
            username: profile.username,
            avatar_url: profile.avatar_url,
            total_credits: stats.total_credits,
            total_co2_impact: stats.total_co2_impact,
            total_jobs: stats.total_jobs,
            avg_score: Math.round(avgScore),
            completed_at: stats.last_completed
          };
        });

        // Sort by total credits for top scores
        const sortedByCredits = [...entries].sort((a, b) => b.total_credits - a.total_credits).slice(0, 10);
        setTopScores(sortedByCredits);

        // Sort by most recent for recent scores
        const sortedByRecent = [...entries].sort((a, b) => 
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        ).slice(0, 10);
        setRecentScores(sortedByRecent);
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
      const { data: completions } = await supabase
        .from("job_completions")
        .select("earned_credits, estimated_co2_kg_impact, quiz_score_percent")
        .eq("user_id", user.id);

      if (completions && completions.length > 0) {
        const totalJobs = completions.length;
        const totalCredits = completions.reduce((sum, c) => sum + c.earned_credits, 0);
        const totalImpact = completions.reduce((sum, c) => sum + parseFloat(c.estimated_co2_kg_impact.toString()), 0);
        const avgScore = completions.reduce((sum, c) => sum + c.quiz_score_percent, 0) / totalJobs;
        const bestScore = Math.max(...completions.map(c => c.quiz_score_percent));

        // Get user rank based on total credits
        const { data: allCompletions } = await supabase
          .from("job_completions")
          .select("user_id, earned_credits");

        if (allCompletions) {
          const userCreditsMap = new Map<string, number>();
          allCompletions.forEach(c => {
            userCreditsMap.set(c.user_id, (userCreditsMap.get(c.user_id) || 0) + c.earned_credits);
          });

          const sortedUsers = Array.from(userCreditsMap.entries()).sort((a, b) => b[1] - a[1]);
          const rank = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

          setUserStats({
            total_jobs: totalJobs,
            average_score: Math.round(avgScore),
            best_score: Math.round(bestScore),
            rank: rank || totalJobs,
            total_credits: totalCredits,
            total_impact: Math.round(totalImpact * 10) / 10
          });
        }
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

  const filteredTopScores = topScores.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecentScores = recentScores.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
          {entry.username?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">
          {entry.username}
          {entry.user_id === user?.id && (
            <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
          )}
        </p>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>{entry.total_jobs} jobs</span>
          <span>•</span>
          <span>{entry.total_co2_impact.toFixed(1)}kg CO₂</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
          {entry.avg_score}% avg
        </Badge>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{entry.total_credits}</p>
          <p className="text-xs text-muted-foreground">credits</p>
        </div>
        {entry.user_id !== user?.id && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/messages?startChat=${entry.user_id}`}>
              <MessageSquare className="h-4 w-4" />
            </Link>
          </Button>
        )}
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
            Global Leaderboard
          </h1>
          <p className="text-muted-foreground">
            Rankings of all users by earned credits and impact
          </p>
        </div>

        {user && userStats && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">Your Stats</h2>
              <p className="text-sm text-muted-foreground">Your personal performance metrics</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
            <Card className="gradient-card hover:shadow-medium transition-smooth">
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{userStats.total_jobs}</p>
                <p className="text-sm text-muted-foreground">Jobs Completed</p>
              </CardContent>
            </Card>
            <Card className="gradient-card hover:shadow-medium transition-smooth">
              <CardContent className="pt-6 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{userStats.total_credits}</p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </CardContent>
            </Card>
            <Card className="gradient-card hover:shadow-medium transition-smooth">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{userStats.total_impact}kg</p>
                <p className="text-sm text-muted-foreground">CO₂ Impact</p>
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
          </>
        )}

        <Card className="gradient-card border-2 shadow-large">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Global Rankings (All Users)
              </div>
            </CardTitle>
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="top" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="top" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Top Earners
                </TabsTrigger>
                <TabsTrigger value="recent" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="top" className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  {isLoading ? (
                    <LeaderboardSkeleton />
                  ) : filteredTopScores.length > 0 ? (
                    <div className="space-y-2">
                      {filteredTopScores.map((entry, index) => renderLeaderboardEntry(entry, index))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No users found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No completed jobs yet. Be the first!</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="recent" className="mt-6">
                <ScrollArea className="h-[600px] pr-4">
                  {isLoading ? (
                    <LeaderboardSkeleton />
                  ) : filteredRecentScores.length > 0 ? (
                    <div className="space-y-2">
                      {filteredRecentScores.map((entry, index) => renderLeaderboardEntry(entry, index))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No users found matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
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
