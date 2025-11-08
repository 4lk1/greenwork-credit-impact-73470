-- Prevent users from inserting verification codes directly
-- Only edge functions with SERVICE_ROLE_KEY can insert (they bypass RLS)
CREATE POLICY "Prevent direct insertion of verification codes"
ON public.verification_codes
FOR INSERT
WITH CHECK (false);

-- Prevent users from deleting verification codes
-- Only edge functions or database functions can manage deletion
CREATE POLICY "Prevent deletion of verification codes"
ON public.verification_codes
FOR DELETE
USING (false);