-- ============================================
-- MESSAGING SYSTEM
-- ============================================

-- Create message_threads table
CREATE TABLE public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN NOT NULL DEFAULT false,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_thread_participants table
CREATE TABLE public.message_thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_request BOOLEAN NOT NULL DEFAULT false,
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_threads
CREATE POLICY "Users can view threads they participate in"
ON public.message_threads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.message_thread_participants
    WHERE thread_id = message_threads.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create threads"
ON public.message_threads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Participants can update thread"
ON public.message_threads FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.message_thread_participants
    WHERE thread_id = message_threads.id AND user_id = auth.uid()
  )
);

-- RLS Policies for message_thread_participants
CREATE POLICY "Users can view participants in their threads"
ON public.message_thread_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.message_thread_participants mtp
    WHERE mtp.thread_id = message_thread_participants.thread_id 
    AND mtp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can add themselves to threads"
ON public.message_thread_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Thread owners can add participants"
ON public.message_thread_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.message_thread_participants mtp
    WHERE mtp.thread_id = message_thread_participants.thread_id
    AND mtp.user_id = auth.uid()
    AND mtp.role = 'owner'
  )
);

CREATE POLICY "Users can update their own participant record"
ON public.message_thread_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave threads"
ON public.message_thread_participants FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their threads"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.message_thread_participants
    WHERE thread_id = messages.thread_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Thread participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.message_thread_participants
    WHERE thread_id = messages.thread_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Senders can update their messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message status"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.message_thread_participants
    WHERE thread_id = messages.thread_id AND user_id = auth.uid()
  )
);

-- Add indexes
CREATE INDEX idx_message_threads_community ON public.message_threads(community_id);
CREATE INDEX idx_message_thread_participants_thread ON public.message_thread_participants(thread_id);
CREATE INDEX idx_message_thread_participants_user ON public.message_thread_participants(user_id);
CREATE INDEX idx_messages_thread ON public.messages(thread_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Add trigger for updating thread updated_at
CREATE OR REPLACE FUNCTION update_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.message_threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_updated_at();