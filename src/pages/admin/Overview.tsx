import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Briefcase, CheckSquare, Coins, Leaf } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function Overview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, jobsRes, completionsRes, statsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('micro_jobs').select('*', { count: 'exact', head: true }),
        supabase.from('job_completions').select('*', { count: 'exact', head: true }),
        supabase.from('job_completions').select('earned_credits, estimated_co2_kg_impact')
      ]);

      const totalCredits = statsRes.data?.reduce((sum, item) => sum + item.earned_credits, 0) || 0;
      const totalCO2 = statsRes.data?.reduce((sum, item) => sum + Number(item.estimated_co2_kg_impact), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalJobs: jobsRes.count || 0,
        totalCompletions: completionsRes.count || 0,
        totalCredits,
        totalCO2
      };
    }
  });

  const { data: chartData } = useQuery({
    queryKey: ['admin-completions-chart'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data } = await supabase
        .from('job_completions')
        .select('completed_at')
        .gte('completed_at', thirtyDaysAgo.toISOString());

      const groupedByDay: Record<string, number> = {};
      data?.forEach((completion) => {
        const day = format(new Date(completion.completed_at!), 'MMM dd');
        groupedByDay[day] = (groupedByDay[day] || 0) + 1;
      });

      return Object.entries(groupedByDay).map(([day, count]) => ({ day, count }));
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Total Micro-Jobs', value: stats?.totalJobs, icon: Briefcase, color: 'text-purple-500' },
    { title: 'Total Completions', value: stats?.totalCompletions, icon: CheckSquare, color: 'text-green-500' },
    { title: 'Total Credits', value: stats?.totalCredits, icon: Coins, color: 'text-yellow-500' },
    { title: 'Total CO₂ Impact (kg)', value: stats?.totalCO2.toFixed(2), icon: Leaf, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">Key metrics and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Completions (Last 30 Days)</CardTitle>
          <CardDescription>Daily completion trends</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Not enough data yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
