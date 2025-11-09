-- Add INSERT policy for message_threads to allow users to create new threads
CREATE POLICY "Users can create message threads"
ON public.message_threads
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure there's a SELECT policy for threads users participate in
DROP POLICY IF EXISTS "Users can view their threads" ON public.message_threads;

CREATE POLICY "Users can view their threads"
ON public.message_threads
FOR SELECT
USING (
  id IN (
    SELECT thread_id 
    FROM public.message_thread_participants 
    WHERE user_id = auth.uid()
  )
);