import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

const CATEGORIES = ['all', 'tree_planting', 'water_harvesting', 'solar_maintenance', 'agroforestry', 'home_insulation'];

export default function Completions() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: completions, isLoading } = useQuery({
    queryKey: ['admin-completions', categoryFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('job_completions')
        .select(`
          *,
          profiles(username),
          micro_jobs(title, category)
        `)
        .order('completed_at', { ascending: false });

      if (dateFrom) {
        query = query.gte('completed_at', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte('completed_at', new Date(dateTo).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      if (categoryFilter !== 'all') {
        return data?.filter((c: any) => c.micro_jobs?.category === categoryFilter);
      }

      return data;
    }
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Job Completions</h2>
        <p className="text-muted-foreground">View all completed jobs and their details</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="w-64">
          <Label>Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>From Date</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <Label>To Date</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Completed At</TableHead>
              <TableHead className="text-right">Quiz Score</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="text-right">CO₂ Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completions?.map((completion: any) => (
              <TableRow key={completion.id}>
                <TableCell>{completion.profiles?.username || 'Unknown'}</TableCell>
                <TableCell className="font-medium">{completion.micro_jobs?.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {completion.micro_jobs?.category.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(completion.completed_at), 'PPp')}</TableCell>
                <TableCell className="text-right">{completion.quiz_score_percent}%</TableCell>
                <TableCell className="text-right">{completion.earned_credits}</TableCell>
                <TableCell className="text-right">{Number(completion.estimated_co2_kg_impact).toFixed(2)} kg</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
