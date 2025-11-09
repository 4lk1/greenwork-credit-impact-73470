-- ============================================
-- COMMUNITIES & MEMBERSHIPS
-- ============================================

-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  region_or_country TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community_memberships table
CREATE TABLE IF NOT EXISTS public.community_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communities
CREATE POLICY "Public communities are viewable by everyone"
ON public.communities FOR SELECT
USING (is_public = true);

CREATE POLICY "Private communities viewable by members"
ON public.communities FOR SELECT
USING (
  NOT is_public AND EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_id = communities.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create communities"
ON public.communities FOR INSERT
WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Community owners can update their communities"
ON public.communities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_id = communities.id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Community owners can delete their communities"
ON public.communities FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_id = communities.id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- RLS Policies for community_memberships
CREATE POLICY "Community memberships are viewable by everyone"
ON public.community_memberships FOR SELECT
USING (true);

CREATE POLICY "Users can join public communities"
ON public.community_memberships FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND is_public = true)
);

CREATE POLICY "Community admins can add members"
ON public.community_memberships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_memberships.community_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can leave communities"
ON public.community_memberships FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Community admins can remove members"
ON public.community_memberships FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_memberships.community_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Community admins can update member roles"
ON public.community_memberships FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships cm
    WHERE cm.community_id = community_memberships.community_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

-- Add indexes
CREATE INDEX idx_communities_created_by ON public.communities(created_by_user_id);
CREATE INDEX idx_communities_region ON public.communities(region_or_country);
CREATE INDEX idx_community_memberships_community ON public.community_memberships(community_id);
CREATE INDEX idx_community_memberships_user ON public.community_memberships(user_id);

-- Add community_id to job_completions for team tracking
ALTER TABLE public.job_completions 
ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;