-- Drop unused legacy users table that allows unrestricted inserts
-- Active authentication uses the profiles table instead
DROP TABLE IF EXISTS public.users CASCADE;