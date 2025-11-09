import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

const CATEGORIES = ['tree_planting', 'water_harvesting', 'solar_maintenance', 'agroforestry', 'home_insulation'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function MicroJobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = id !== 'new';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'tree_planting',
    difficulty_level: 'Beginner',
    estimated_duration_minutes: 30,
    reward_credits: 10,
    estimated_co2_kg_impact: 5,
    location: '',
    is_active: true
  });

  const { data: job, isLoading } = useQuery({
    queryKey: ['admin-microjob', id],
    queryFn: async () => {
      if (!isEditing) return null;
      const { data, error } = await supabase
        .from('micro_jobs')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing
  });

  useEffect(() => {
    if (job) {
      setFormData(job);
    }
  }, [job]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        const { error } = await supabase
          .from('micro_jobs')
          .update(formData)
          .eq('id', id!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('micro_jobs')
          .insert([formData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Success', description: `Job ${isEditing ? 'updated' : 'created'} successfully` });
      queryClient.invalidateQueries({ queryKey: ['admin-microjobs'] });
      navigate('/admin/microjobs');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  if (isLoading && isEditing) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/microjobs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h2 className="text-3xl font-bold text-foreground">
          {isEditing ? 'Edit Micro-Job' : 'Create New Micro-Job'}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                <SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={formData.difficulty_level} onValueChange={(val) => setFormData({ ...formData, difficulty_level: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="credits">Reward Credits</Label>
              <Input
                id="credits"
                type="number"
                value={formData.reward_credits}
                onChange={(e) => setFormData({ ...formData, reward_credits: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="co2">CO₂ Impact (kg)</Label>
              <Input
                id="co2"
                type="number"
                step="0.1"
                value={formData.estimated_co2_kg_impact}
                onChange={(e) => setFormData({ ...formData, estimated_co2_kg_impact: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Update Job' : 'Create Job'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
