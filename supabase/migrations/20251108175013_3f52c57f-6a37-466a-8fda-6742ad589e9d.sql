-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update job_completions to require user_id
ALTER TABLE public.job_completions ALTER COLUMN user_id SET NOT NULL;

-- Update job_completions RLS policies
DROP POLICY IF EXISTS "Public insert access for job_completions" ON public.job_completions;
DROP POLICY IF EXISTS "Public read access for job_completions" ON public.job_completions;

CREATE POLICY "Users can view own completions" 
ON public.job_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" 
ON public.job_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view all completions for stats"
ON public.job_completions
FOR SELECT
USING (true);

-- Update job_progress to require user_id
ALTER TABLE public.job_progress ALTER COLUMN user_id SET NOT NULL;

-- Update job_progress RLS policies
DROP POLICY IF EXISTS "Public read access for job_progress" ON public.job_progress;
DROP POLICY IF EXISTS "Public insert access for job_progress" ON public.job_progress;
DROP POLICY IF EXISTS "Public update access for job_progress" ON public.job_progress;
DROP POLICY IF EXISTS "Public delete access for job_progress" ON public.job_progress;

CREATE POLICY "Users can view own progress" 
ON public.job_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" 
ON public.job_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
ON public.job_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" 
ON public.job_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();