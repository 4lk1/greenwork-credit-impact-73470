import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function Users() {
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          job_completions(earned_credits)
        `);

      if (search) {
        query = query.ilike('username', `%${search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      return data?.map(user => ({
        ...user,
        totalCredits: user.job_completions?.reduce((sum: number, c: any) => sum + c.earned_credits, 0) || 0,
        totalJobs: user.job_completions?.length || 0
      }));
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Users Management</h2>
        <p className="text-muted-foreground">View and manage user accounts</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Total Jobs</TableHead>
              <TableHead className="text-right">Total Credits</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{format(new Date(user.created_at), 'PP')}</TableCell>
                <TableCell className="text-right">{user.totalJobs}</TableCell>
                <TableCell className="text-right">{user.totalCredits}</TableCell>
                <TableCell className="text-right">
                  <Link to={`/admin/users/${user.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
