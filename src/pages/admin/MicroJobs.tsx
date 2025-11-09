import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit } from 'lucide-react';

const CATEGORIES = ['tree_planting', 'water_harvesting', 'solar_maintenance', 'agroforestry', 'home_insulation'];

export default function MicroJobs() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['admin-microjobs', categoryFilter],
    queryFn: async () => {
      let query = supabase.from('micro_jobs').select('*');

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('micro_jobs')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-microjobs'] });
      toast({ title: 'Success', description: 'Job status updated' });
    }
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Micro-Jobs Management</h2>
          <p className="text-muted-foreground">Manage job listings and categories</p>
        </div>
        <Link to="/admin/microjobs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Credits</TableHead>
              <TableHead className="text-right">CO₂ Impact</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs?.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {job.category.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{job.difficulty_level}</TableCell>
                <TableCell className="text-right">{job.reward_credits}</TableCell>
                <TableCell className="text-right">{Number(job.estimated_co2_kg_impact).toFixed(2)} kg</TableCell>
                <TableCell>
                  <Switch
                    checked={job.is_active ?? true}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: job.id, isActive: checked })
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/admin/microjobs/${job.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
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
