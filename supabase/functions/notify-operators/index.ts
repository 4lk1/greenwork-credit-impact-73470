import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  job_id: z.string().uuid("Invalid job ID format"),
  event_type: z.string().min(1).max(100, "Event type too long"),
  message: z.string().min(1).max(500, "Message too long (max 500 characters)"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { job_id, event_type, message } = validation.data;

    // Fetch job details
    const { data: job, error: jobError } = await supabaseClient
      .from('micro_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the notification event
    console.log('Notification triggered:', {
      job_id,
      job_title: job.title,
      event_type,
      message,
      triggered_by: user.id,
      timestamp: new Date().toISOString()
    });

    // In a production environment, you would:
    // 1. Send push notifications via Firebase/OneSignal
    // 2. Send emails via Resend/SendGrid
    // 3. Send SMS via Twilio
    // 4. Create in-app notifications in a notifications table

    // For now, we'll just broadcast via Realtime
    const channel = supabaseClient.channel(`job-notifications-${job_id}`);
    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        job_id,
        event_type,
        message,
        job_title: job.title,
        timestamp: new Date().toISOString(),
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent',
        notification: {
          job_id,
          event_type,
          message
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-operators:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});