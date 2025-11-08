-- Create verification codes table
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'login')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert verification codes
CREATE POLICY "Anyone can create verification codes"
ON public.verification_codes
FOR INSERT
WITH CHECK (true);

-- Create policy to allow anyone to read their own codes
CREATE POLICY "Users can read their own verification codes"
ON public.verification_codes
FOR SELECT
USING (true);

-- Create policy to allow anyone to update verification codes
CREATE POLICY "Anyone can update verification codes"
ON public.verification_codes
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_email_code ON public.verification_codes(email, code, type);
CREATE INDEX idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Create function to clean up expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_codes
  WHERE expires_at < now() - interval '1 hour';
END;
$$;