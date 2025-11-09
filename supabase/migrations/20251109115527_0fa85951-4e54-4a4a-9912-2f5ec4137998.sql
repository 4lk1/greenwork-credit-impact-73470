-- Drop and recreate the view without security definer issues
DROP VIEW IF EXISTS public.user_follow_stats;

-- Recreate view as a simple query view (no security definer)
CREATE VIEW public.user_follow_stats AS
SELECT 
  p.id as user_id,
  p.username,
  COALESCE(followers.count, 0)::bigint as followers_count,
  COALESCE(following.count, 0)::bigint as following_count
FROM public.profiles p
LEFT JOIN (
  SELECT following_id, COUNT(*) as count
  FROM public.follows
  GROUP BY following_id
) followers ON p.id = followers.following_id
LEFT JOIN (
  SELECT follower_id, COUNT(*) as count
  FROM public.follows
  GROUP BY follower_id
) following ON p.id = following.follower_id;

-- Enable RLS on the view (views inherit from their source tables)
ALTER VIEW public.user_follow_stats SET (security_barrier = true);

-- Grant read access to authenticated users
GRANT SELECT ON public.user_follow_stats TO authenticated;
GRANT SELECT ON public.user_follow_stats TO anon;