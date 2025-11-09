-- Extend communities table with new fields
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS rules TEXT,
ADD COLUMN IF NOT EXISTS pinned_message TEXT,
ADD COLUMN IF NOT EXISTS announcement TEXT;

-- Create community missions table
CREATE TABLE IF NOT EXISTS public.community_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_jobs INTEGER,
  target_credits INTEGER,
  target_co2 NUMERIC,
  due_date TIMESTAMP WITH TIME ZONE,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on community missions
ALTER TABLE public.community_missions ENABLE ROW LEVEL SECURITY;

-- RLS policies for community missions
CREATE POLICY "Anyone can view active community missions"
ON public.community_missions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Community admins can create missions"
ON public.community_missions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_id = community_missions.community_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Community admins can update missions"
ON public.community_missions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_id = community_missions.community_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Community admins can delete missions"
ON public.community_missions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.community_memberships
    WHERE community_id = community_missions.community_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Create function to initialize community chat thread
CREATE OR REPLACE FUNCTION public.create_community_chat_thread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  -- Create a group message thread for the community
  INSERT INTO public.message_threads (is_group, community_id)
  VALUES (true, NEW.id)
  RETURNING id INTO v_thread_id;
  
  -- Add the community creator as the thread owner
  INSERT INTO public.message_thread_participants (thread_id, user_id, role)
  VALUES (v_thread_id, NEW.created_by_user_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create chat thread when community is created
DROP TRIGGER IF EXISTS on_community_created ON public.communities;
CREATE TRIGGER on_community_created
AFTER INSERT ON public.communities
FOR EACH ROW
EXECUTE FUNCTION public.create_community_chat_thread();

-- Enable realtime for community missions
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_missions;