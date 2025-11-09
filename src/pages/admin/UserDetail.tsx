import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          job_completions(
            id,
            microjob_id,
            earned_credits,
            estimated_co2_kg_impact,
            completed_at,
            micro_jobs(title)
          )
        `)
        .eq('id', id!)
        .single();

      if (error) throw error;

      setUsername(data.username);
      setAvatarUrl(data.avatar_url || '');

      return {
        ...data,
        totalCredits: data.job_completions?.reduce((sum: number, c: any) => sum + c.earned_credits, 0) || 0,
        totalCO2: data.job_completions?.reduce((sum: number, c: any) => sum + Number(c.estimated_co2_kg_impact), 0) || 0,
      };
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ username, avatar_url: avatarUrl })
        .eq('id', id!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'User updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">User Details</h2>
          <p className="text-muted-foreground">{user?.username}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since:</span>
              <span className="font-medium">{format(new Date(user?.created_at!), 'PP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Jobs:</span>
              <span className="font-medium">{user?.job_completions?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Credits:</span>
              <span className="font-medium">{user?.totalCredits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total CO₂ Impact:</span>
              <span className="font-medium">{user?.totalCO2.toFixed(2)} kg</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Completions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">CO₂ Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user?.job_completions?.map((completion: any) => (
                <TableRow key={completion.id}>
                  <TableCell>{completion.micro_jobs?.title}</TableCell>
                  <TableCell>{format(new Date(completion.completed_at), 'PPp')}</TableCell>
                  <TableCell className="text-right">{completion.earned_credits}</TableCell>
                  <TableCell className="text-right">{Number(completion.estimated_co2_kg_impact).toFixed(2)} kg</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
