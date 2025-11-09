-- Create follows table for user relationships (unidirectional like Twitter/Instagram)
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table

-- Users can view who they follow
CREATE POLICY "Users can view their own follows"
ON public.follows
FOR SELECT
USING (auth.uid() = follower_id);

-- Users can view who follows them
CREATE POLICY "Users can view their followers"
ON public.follows
FOR SELECT
USING (auth.uid() = following_id);

-- Everyone can view follow relationships (for public profiles)
CREATE POLICY "Public can view all follows"
ON public.follows
FOR SELECT
USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
ON public.follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others
CREATE POLICY "Users can unfollow others"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id);

-- Create indexes for better query performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Create a view for easy follower/following counts
CREATE OR REPLACE VIEW public.user_follow_stats AS
SELECT 
  p.id as user_id,
  p.username,
  COALESCE(followers.count, 0) as followers_count,
  COALESCE(following.count, 0) as following_count
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