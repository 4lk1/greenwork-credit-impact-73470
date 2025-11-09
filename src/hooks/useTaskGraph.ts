import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface JobTask {
  id: string;
  job_id: string;
  title: string;
  description: string | null;
  order_index: number;
  depends_on: string[];
  status: 'pending' | 'in_progress' | 'done';
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useTaskGraph = (jobId: string) => {
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('job_tasks')
          .select('*')
          .eq('job_id', jobId)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchTasks();

      // Subscribe to realtime updates
      channel = supabase
        .channel(`job-tasks-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'job_tasks',
            filter: `job_id=eq.${jobId}`,
          },
          (payload) => {
            console.log('Task change:', payload);

            if (payload.eventType === 'INSERT') {
              setTasks((prev) => [...prev, payload.new as JobTask].sort((a, b) => a.order_index - b.order_index));
            } else if (payload.eventType === 'UPDATE') {
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === payload.new.id ? (payload.new as JobTask) : t
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [jobId]);

  return { tasks, loading };
};