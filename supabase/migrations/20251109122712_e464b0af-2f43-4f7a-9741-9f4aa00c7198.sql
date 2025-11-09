-- Fix message_thread_participants RLS policies to avoid recursion
DROP POLICY IF EXISTS "Users can view participants in their threads v2" ON public.message_thread_participants;
DROP POLICY IF EXISTS "Thread owners can add participants v2" ON public.message_thread_participants;
DROP POLICY IF EXISTS "Users can add themselves to threads" ON public.message_thread_participants;

-- Simple non-recursive policies
CREATE POLICY "Users can view their own participant records"
ON public.message_thread_participants
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view other participants in same threads"
ON public.message_thread_participants
FOR SELECT
USING (
  thread_id IN (
    SELECT thread_id 
    FROM public.message_thread_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves as participants"
ON public.message_thread_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Thread owners can add other participants"
ON public.message_thread_participants
FOR INSERT
WITH CHECK (
  thread_id IN (
    SELECT thread_id 
    FROM public.message_thread_participants 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);