import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const CATEGORIES = ['tree_planting', 'water_harvesting', 'solar_maintenance', 'agroforestry', 'home_insulation'];

export default function Data() {
  const queryClient = useQueryClient();
  const [editedRows, setEditedRows] = useState<Record<string, string>>({});

  const { data: countryScores, isLoading } = useQuery({
    queryKey: ['admin-country-scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_scores')
        .select('*')
        .order('priority_score', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: string }) => {
      const { error } = await supabase
        .from('country_scores')
        .update({ recommended_microjob_category: category })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-country-scores'] });
      toast({ title: 'Success', description: 'Country data updated' });
      setEditedRows({});
    }
  });

  const handleCategoryChange = (id: string, category: string) => {
    setEditedRows({ ...editedRows, [id]: category });
  };

  const handleSave = (id: string) => {
    if (editedRows[id]) {
      updateMutation.mutate({ id, category: editedRows[id] });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Country Scores Data</h2>
        <p className="text-muted-foreground">Manage country-level climate and inequality data</p>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>ISO</TableHead>
              <TableHead className="text-right">Climate Score</TableHead>
              <TableHead className="text-right">Inequality Score</TableHead>
              <TableHead className="text-right">Priority Score</TableHead>
              <TableHead>Recommended Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countryScores?.map((country) => (
              <TableRow key={country.id}>
                <TableCell className="font-medium">{country.country_name}</TableCell>
                <TableCell>{country.iso_country}</TableCell>
                <TableCell className="text-right">{Number(country.climate_need_score).toFixed(2)}</TableCell>
                <TableCell className="text-right">{Number(country.inequality_score).toFixed(2)}</TableCell>
                <TableCell className="text-right font-bold">{Number(country.priority_score).toFixed(2)}</TableCell>
                <TableCell>
                  <Select
                    value={editedRows[country.id] || country.recommended_microjob_category}
                    onValueChange={(val) => handleCategoryChange(country.id, val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  {editedRows[country.id] && (
                    <Button
                      size="sm"
                      onClick={() => handleSave(country.id)}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
