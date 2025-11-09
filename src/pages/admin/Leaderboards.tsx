import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Leaderboards() {
  const { data: topUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-leaderboard-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_completions')
        .select(`
          user_id,
          earned_credits,
          estimated_co2_kg_impact,
          profiles(username)
        `);

      const userStats: Record<string, any> = {};
      data?.forEach((completion: any) => {
        const userId = completion.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            username: completion.profiles?.username || 'Unknown',
            totalCredits: 0,
            totalCO2: 0,
            totalJobs: 0
          };
        }
        userStats[userId].totalCredits += completion.earned_credits;
        userStats[userId].totalCO2 += Number(completion.estimated_co2_kg_impact);
        userStats[userId].totalJobs += 1;
      });

      return Object.values(userStats)
        .sort((a: any, b: any) => b.totalCredits - a.totalCredits)
        .slice(0, 20);
    }
  });

  if (usersLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Global Leaderboards</h2>
        <p className="text-muted-foreground">Top performers and statistics across all users</p>
      </div>

      <Alert>
        <Trophy className="h-4 w-4" />
        <AlertDescription>
          Points are calculated from total earned credits from job completions.
          The leaderboard is used for monitoring and gamification purposes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Top Users</CardTitle>
          <CardDescription>Ranked by total credits earned</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Jobs Completed</TableHead>
                <TableHead className="text-right">Total Credits</TableHead>
                <TableHead className="text-right">Total CO₂ Impact (kg)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers?.map((user: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {index === 0 && <Trophy className="w-5 h-5 text-yellow-500 mr-1" />}
                      {index === 1 && <Trophy className="w-5 h-5 text-gray-400 mr-1" />}
                      {index === 2 && <Trophy className="w-5 h-5 text-orange-600 mr-1" />}
                      <span className="font-bold">{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-right">{user.totalJobs}</TableCell>
                  <TableCell className="text-right font-bold">{user.totalCredits}</TableCell>
                  <TableCell className="text-right">{user.totalCO2.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
