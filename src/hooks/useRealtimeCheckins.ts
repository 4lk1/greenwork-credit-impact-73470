import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface WorkerCheckin {
  id: string;
  worker_id: string;
  job_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  status: 'idle' | 'active' | 'paused' | 'finished';
  comment: string | null;
  created_at: string;
}

export const useRealtimeCheckins = (jobId?: string) => {
  const [checkins, setCheckins] = useState<WorkerCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const fetchCheckins = async () => {
      try {
        let query = supabase
          .from('worker_checkins')
          .select('*')
          .order('timestamp', { ascending: false });

        if (jobId) {
          query = query.eq('job_id', jobId);
        }

        const { data, error } = await query;

        if (error) throw error;
        setCheckins(data || []);
      } catch (error) {
        console.error('Error fetching checkins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckins();

    // Subscribe to realtime updates
    channel = supabase
      .channel('worker-checkins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_checkins',
          filter: jobId ? `job_id=eq.${jobId}` : undefined,
        },
        (payload) => {
          console.log('Checkin change:', payload);

          if (payload.eventType === 'INSERT') {
            setCheckins((prev) => [payload.new as WorkerCheckin, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCheckins((prev) =>
              prev.map((c) =>
                c.id === payload.new.id ? (payload.new as WorkerCheckin) : c
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCheckins((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { checkins, loading };
};