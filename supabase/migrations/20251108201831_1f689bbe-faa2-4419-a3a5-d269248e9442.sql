-- Fix security issue 1: verification_codes email exposure
-- Drop the existing insecure SELECT policy
DROP POLICY IF EXISTS "Users can read their own verification codes" ON public.verification_codes;

-- Create secure SELECT policy that only allows users to see codes for their own email
CREATE POLICY "Users can read their own verification codes"
ON public.verification_codes
FOR SELECT
USING (email = auth.jwt()->>'email');

-- Fix security issue 2: users table public exposure
-- Drop the existing public read policy
DROP POLICY IF EXISTS "Public read access for users" ON public.users;

-- Create secure SELECT policy that only allows users to see their own data
CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Fix security issue 3: verification_codes unrestricted updates
-- Drop the existing insecure UPDATE policy
DROP POLICY IF EXISTS "Anyone can update verification codes" ON public.verification_codes;

-- Create secure UPDATE policy that only allows users to update their own codes
CREATE POLICY "Users can update their own verification codes"
ON public.verification_codes
FOR UPDATE
USING (email = auth.jwt()->>'email');