import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Database, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SeedData() {
  const [result, setResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const seedMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('seed-microjobs');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['admin-microjobs'] });
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Created ${data.jobsCreated} jobs, ${data.modulesCreated} training modules, and ${data.questionsCreated} quiz questions`
        });
      } else {
        toast({
          title: 'Info',
          description: data.message || 'Database already populated'
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to seed data',
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Seed Database</h2>
        <p className="text-muted-foreground">Populate the database with 100 sample micro-jobs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seed Micro-Jobs Data</CardTitle>
          <CardDescription>
            This will add 100 realistic micro-jobs across all categories, along with training modules and quiz questions.
            The seeding process will only run if there are fewer than 20 jobs in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>What will be created:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>100 micro-jobs (20 per category)</li>
                <li>100 training modules (1 per job)</li>
                <li>400 quiz questions (4 per module)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                {result.success ? (
                  <>
                    <strong>Successfully seeded!</strong>
                    <ul className="list-disc list-inside mt-2">
                      <li>Jobs created: {result.jobsCreated}</li>
                      <li>Training modules: {result.modulesCreated}</li>
                      <li>Quiz questions: {result.questionsCreated}</li>
                    </ul>
                  </>
                ) : (
                  <>{result.message}</>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={() => seedMutation.mutate()} 
            disabled={seedMutation.isPending}
            size="lg"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding Database...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Seed 100 Micro-Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
