import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResults {
  users: any[];
  communities: any[];
  microjobs: any[];
  regions: any[];
  learning: any[];
}

Deno.serve(async (req) => {
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

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'all';
    const limit = type === 'all' ? 5 : 20;

    console.log(`Searching for: "${query}", type: ${type}`);

    if (query.length < 2) {
      return new Response(
        JSON.stringify({
          users: [],
          communities: [],
          microjobs: [],
          regions: [],
          learning: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: SearchResults = {
      users: [],
      communities: [],
      microjobs: [],
      regions: [],
      learning: [],
    };

    // Search users (profiles)
    if (type === 'all' || type === 'users') {
      const { data: users, error: usersError } = await supabaseClient
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(limit);

      if (!usersError && users) {
        // Fetch stats for each user
        const usersWithStats = await Promise.all(
          users.map(async (user) => {
            const { data: completions } = await supabaseClient
              .from('job_completions')
              .select('earned_credits')
              .eq('user_id', user.id);

            const totalCredits = completions?.reduce((sum, c) => sum + (c.earned_credits || 0), 0) || 0;

            return {
              ...user,
              display_name: user.username,
              stats: { total_credits: totalCredits },
            };
          })
        );
        results.users = usersWithStats;
      }
    }

    // Search communities
    if (type === 'all' || type === 'communities') {
      const { data: communities, error: communitiesError } = await supabaseClient
        .from('communities')
        .select('id, name, description, region_or_country, is_public')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_public', true)
        .limit(limit);

      if (!communitiesError && communities) {
        // Fetch member count for each community
        const communitiesWithStats = await Promise.all(
          communities.map(async (community) => {
            const { count } = await supabaseClient
              .from('community_memberships')
              .select('*', { count: 'exact', head: true })
              .eq('community_id', community.id);

            return {
              ...community,
              member_count: count || 0,
            };
          })
        );
        results.communities = communitiesWithStats;
      }
    }

    // Search micro-jobs
    if (type === 'all' || type === 'microjobs') {
      const { data: microjobs, error: microjobsError } = await supabaseClient
        .from('micro_jobs')
        .select('id, title, category, difficulty_level, reward_credits, estimated_duration_minutes, estimated_co2_kg_impact')
        .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(limit);

      if (!microjobsError) {
        results.microjobs = microjobs || [];
      }
    }

    // Search regions/countries
    if (type === 'all' || type === 'regions') {
      const { data: regions, error: regionsError } = await supabaseClient
        .from('country_scores')
        .select('id, country_name, iso_country, priority_score, climate_need_score, inequality_score')
        .or(`country_name.ilike.%${query}%,iso_country.ilike.%${query}%`)
        .limit(limit);

      if (!regionsError) {
        results.regions = regions || [];
      }
    }

    // Search learning content (training modules)
    if (type === 'all' || type === 'learning') {
      const { data: learning, error: learningError } = await supabaseClient
        .from('training_modules')
        .select('id, title, content, microjob_id')
        .ilike('title', `%${query}%`)
        .limit(limit);

      if (!learningError) {
        results.learning = (learning || []).map(module => ({
          ...module,
          type: 'TrainingModule',
        }));
      }
    }

    console.log('Search results:', {
      users: results.users.length,
      communities: results.communities.length,
      microjobs: results.microjobs.length,
      regions: results.regions.length,
      learning: results.learning.length,
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
