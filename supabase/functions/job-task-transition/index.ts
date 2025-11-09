import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  task_id: z.string().uuid("Invalid task ID format"),
  new_status: z.enum(['pending', 'in_progress', 'done'], {
    errorMap: () => ({ message: "Status must be 'pending', 'in_progress', or 'done'" })
  }),
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

    const { task_id, new_status } = validation.data;

    // Fetch the task
    const { data: task, error: taskError } = await supabaseClient
      .from('job_tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      return new Response(
        JSON.stringify({ error: 'Task not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is assigned to this task
    if (task.assigned_to !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not assigned to this task' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If marking as done, check dependencies
    if (new_status === 'done' && task.depends_on && task.depends_on.length > 0) {
      const { data: dependencies } = await supabaseClient
        .from('job_tasks')
        .select('id, status')
        .in('id', task.depends_on);

      const allDependenciesDone = dependencies?.every(dep => dep.status === 'done');
      if (!allDependenciesDone) {
        return new Response(
          JSON.stringify({ error: 'Cannot complete task: dependencies not finished' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update task status
    const updateData: any = { status: new_status };
    if (new_status === 'in_progress' && !task.started_at) {
      updateData.started_at = new Date().toISOString();
    }
    if (new_status === 'done') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedTask, error: updateError } = await supabaseClient
      .from('job_tasks')
      .update(updateData)
      .eq('id', task_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Task updated:', updatedTask.id, 'Status:', new_status);

    // If task is done, find and enable dependent tasks
    if (new_status === 'done') {
      const { data: dependentTasks } = await supabaseClient
        .from('job_tasks')
        .select('*')
        .eq('job_id', task.job_id)
        .contains('depends_on', [task_id]);

      console.log('Found dependent tasks:', dependentTasks?.length || 0);
    }

    return new Response(
      JSON.stringify({ success: true, task: updatedTask }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in job-task-transition:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});