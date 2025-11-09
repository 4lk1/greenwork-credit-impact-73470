-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_follower', 'new_message', 'community_join', 'job_completed', 'message_request')),
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, data)
  VALUES (p_user_id, p_type, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Create trigger for new follower notification
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.following_id,
    'new_follower',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', (SELECT username FROM public.profiles WHERE id = NEW.follower_id)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_follower
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION notify_new_follower();

-- Create trigger for community join notification
CREATE OR REPLACE FUNCTION notify_community_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify community owner when someone joins
  PERFORM create_notification(
    (SELECT created_by_user_id FROM public.communities WHERE id = NEW.community_id),
    'community_join',
    jsonb_build_object(
      'user_id', NEW.user_id,
      'username', (SELECT username FROM public.profiles WHERE id = NEW.user_id),
      'community_id', NEW.community_id,
      'community_name', (SELECT name FROM public.communities WHERE id = NEW.community_id)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_community_join
AFTER INSERT ON public.community_memberships
FOR EACH ROW
WHEN (NEW.role = 'member')
EXECUTE FUNCTION notify_community_join();

-- Create trigger for new message notification
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all participants except sender
  INSERT INTO public.notifications (user_id, type, data)
  SELECT 
    mtp.user_id,
    CASE 
      WHEN NEW.is_request THEN 'message_request'
      ELSE 'new_message'
    END,
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'sender_name', (SELECT username FROM public.profiles WHERE id = NEW.sender_id),
      'thread_id', NEW.thread_id,
      'content_preview', LEFT(NEW.content, 50)
    )
  FROM public.message_thread_participants mtp
  WHERE mtp.thread_id = NEW.thread_id 
    AND mtp.user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();