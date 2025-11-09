import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { other_user_id } = await req.json();

    if (!other_user_id) {
      return new Response(JSON.stringify({ error: 'other_user_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if a thread already exists between these two users
    const { data: existingParticipants } = await supabase
      .from('message_thread_participants')
      .select('thread_id')
      .eq('user_id', user.id);

    const myThreadIds = existingParticipants?.map(p => p.thread_id) || [];

    if (myThreadIds.length > 0) {
      const { data: otherParticipants } = await supabase
        .from('message_thread_participants')
        .select('thread_id')
        .eq('user_id', other_user_id)
        .in('thread_id', myThreadIds);

      if (otherParticipants && otherParticipants.length > 0) {
        // Thread exists
        const existingThreadId = otherParticipants[0].thread_id;
        
        console.log('Thread already exists:', existingThreadId);
        
        return new Response(
          JSON.stringify({ thread_id: existingThreadId, created: false }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if users follow each other
    const { data: followData } = await supabase
      .from('follows')
      .select('id')
      .or(`and(follower_id.eq.${user.id},following_id.eq.${other_user_id}),and(follower_id.eq.${other_user_id},following_id.eq.${user.id})`);

    const isFollowing = followData && followData.length > 0;

    console.log('Users follow each other:', isFollowing);

    // Create new thread
    const { data: newThread, error: threadError } = await supabase
      .from('message_threads')
      .insert({
        is_group: false,
      })
      .select()
      .single();

    if (threadError) {
      console.error('Error creating thread:', threadError);
      throw threadError;
    }

    console.log('Created new thread:', newThread.id);

    // Add both users as participants
    const { error: participantsError } = await supabase
      .from('message_thread_participants')
      .insert([
        {
          thread_id: newThread.id,
          user_id: user.id,
          role: 'owner',
        },
        {
          thread_id: newThread.id,
          user_id: other_user_id,
          role: 'member',
        },
      ]);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      throw participantsError;
    }

    console.log('Added participants to thread');

    return new Response(
      JSON.stringify({ 
        thread_id: newThread.id, 
        created: true,
        is_request: !isFollowing 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in start-message-thread:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
