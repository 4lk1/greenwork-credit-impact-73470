-- Create admin_sessions table for admin authentication
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- No policies needed - admin sessions are managed by edge functions with service role key

-- Create index on session_token for fast lookups
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(session_token);

-- Create index on expires_at for cleanup
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- Clean up expired sessions function
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_sessions
  WHERE expires_at < now();
END;
$$;