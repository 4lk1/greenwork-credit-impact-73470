-- Drop the recursive RLS policies
DROP POLICY IF EXISTS "Users can view other participants in same threads" ON public.message_thread_participants;

-- Keep only the simple non-recursive policy
-- (The "Users can view their own participant records" policy should already exist)

-- Create a security definer function to check if a thread exists between two users
CREATE OR REPLACE FUNCTION public.get_shared_thread_id(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  shared_thread_id uuid;
BEGIN
  -- Find a thread where both users are participants
  SELECT mtp1.thread_id INTO shared_thread_id
  FROM message_thread_participants mtp1
  INNER JOIN message_thread_participants mtp2 
    ON mtp1.thread_id = mtp2.thread_id
  WHERE mtp1.user_id = user1_id 
    AND mtp2.user_id = user2_id
    AND NOT EXISTS (
      SELECT 1 FROM message_threads mt 
      WHERE mt.id = mtp1.thread_id 
      AND mt.community_id IS NOT NULL
    )
  LIMIT 1;
  
  RETURN shared_thread_id;
END;
$$;