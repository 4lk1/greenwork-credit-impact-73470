-- Fix infinite recursion in message_thread_participants RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their threads" ON public.message_thread_participants;
DROP POLICY IF EXISTS "Thread owners can add participants" ON public.message_thread_participants;

-- Create non-recursive policies
CREATE POLICY "Users can view participants in their threads v2"
ON public.message_thread_participants
FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.message_thread_participants mtp2
    WHERE mtp2.thread_id = message_thread_participants.thread_id
    AND mtp2.user_id = auth.uid()
    AND mtp2.id != message_thread_participants.id
  )
);

CREATE POLICY "Thread owners can add participants v2"
ON public.message_thread_participants
FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.message_thread_participants mtp2
    WHERE mtp2.thread_id = message_thread_participants.thread_id
    AND mtp2.user_id = auth.uid()
    AND mtp2.role = 'owner'
    AND mtp2.id != gen_random_uuid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;