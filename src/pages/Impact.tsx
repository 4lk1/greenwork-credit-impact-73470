import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Award, Leaf, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface JobCompletion {
  id: string;
  completed_at: string;
  quiz_score_percent: number;
  earned_credits: number;
  estimated_co2_kg_impact: number;
  micro_jobs: {
    title: string;
    category: string;
  };
}

interface ImpactStats {
  totalJobs: number;
  totalCredits: number;
  totalCO2: number;
  avgScore: number;
}

const Impact = () => {
  const [completions, setCompletions] = useState<JobCompletion[]>([]);
  const [stats, setStats] = useState<ImpactStats>({
    totalJobs: 0,
    totalCredits: 0,
    totalCO2: 0,
    avgScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletions();
  }, []);

  const fetchCompletions = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No user found");
        setLoading(false);
        return;
      }

      // Fetch only the current user's completions
      const { data, error } = await supabase
        .from("job_completions")
        .select(`
          *,
          micro_jobs (
            title,
            category
          )
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      const completionsData = data as unknown as JobCompletion[];
      setCompletions(completionsData);

      // Calculate stats
      const totalJobs = completionsData.length;
      const totalCredits = completionsData.reduce((sum, c) => sum + c.earned_credits, 0);
      const totalCO2 = completionsData.reduce((sum, c) => sum + Number(c.estimated_co2_kg_impact), 0);
      const avgScore = totalJobs > 0
        ? Math.round(completionsData.reduce((sum, c) => sum + c.quiz_score_percent, 0) / totalJobs)
        : 0;

      setStats({ totalJobs, totalCredits, totalCO2, avgScore });
    } catch (error) {
      console.error("Error fetching completions:", error);
      toast.error("Failed to load impact data");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = () => {
    const categoryMap: Record<string, { co2: number; credits: number }> = {};
    completions.forEach((c) => {
      const category = c.micro_jobs.category;
      if (!categoryMap[category]) {
        categoryMap[category] = { co2: 0, credits: 0 };
      }
      categoryMap[category].co2 += Number(c.estimated_co2_kg_impact);
      categoryMap[category].credits += c.earned_credits;
    });

    return Object.entries(categoryMap).map(([name, data]) => ({
      name: name.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      co2: Math.round(data.co2 * 10) / 10,
      credits: data.credits,
    }));
  };

  const COLORS = ["hsl(142, 76%, 36%)", "hsl(197, 71%, 73%)", "hsl(28, 80%, 52%)", "hsl(45, 93%, 47%)", "hsl(145, 8%, 15%)"];

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Your Impact Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Track your contribution to climate resilience
            </p>
          </div>

          {/* Prototype Disclaimer */}
          <Card className="bg-muted/50 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Our prototype simulates how climate-resilience micro-jobs can generate both
                economic and climate benefits. In a real deployment, each completion would
                correspond to verified field activity.
              </p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalJobs}</div>
                <p className="text-xs text-muted-foreground">
                  Micro-jobs finished
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                <Award className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCredits}</div>
                <p className="text-xs text-muted-foreground">
                  Credits earned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CO₂ Impact</CardTitle>
                <Leaf className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCO2.toFixed(1)} kg</div>
                <p className="text-xs text-muted-foreground">
                  Estimated offset
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Quiz Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgScore}%</div>
                <p className="text-xs text-muted-foreground">
                  Learning performance
                </p>
              </CardContent>
            </Card>
          </div>

          {completions.length > 0 ? (
            <>
              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Credits by Category</CardTitle>
                    <CardDescription>Total credits earned per job category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getCategoryData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="credits" fill="hsl(28, 80%, 52%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>CO₂ Impact by Category</CardTitle>
                    <CardDescription>Distribution of your climate impact</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getCategoryData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="co2"
                        >
                          {getCategoryData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Completions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Completions</CardTitle>
                  <CardDescription>Your latest micro-job achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completions.slice(0, 5).map((completion) => (
                      <div
                        key={completion.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{completion.micro_jobs.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Completed {new Date(completion.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-warning">{completion.earned_credits}</div>
                            <div className="text-xs text-muted-foreground">credits</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-success">
                              {Number(completion.estimated_co2_kg_impact).toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground">kg CO₂</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{completion.quiz_score_percent}%</div>
                            <div className="text-xs text-muted-foreground">score</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Impact Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start completing micro-jobs to see your impact here!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Impact;
