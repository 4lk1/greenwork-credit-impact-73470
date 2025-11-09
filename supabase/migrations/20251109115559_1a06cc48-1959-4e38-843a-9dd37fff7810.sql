-- Drop and recreate the view with proper security settings
DROP VIEW IF EXISTS public.user_follow_stats;

-- Recreate view with security_invoker to respect RLS
CREATE VIEW public.user_follow_stats 
WITH (security_invoker=on)
AS
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