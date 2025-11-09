-- Fix job_progress table: rename last_updated to updated_at
ALTER TABLE public.job_progress RENAME COLUMN last_updated TO updated_at;

-- Drop the incorrect foreign key constraint on job_completions
ALTER TABLE public.job_completions DROP CONSTRAINT IF EXISTS job_completions_user_id_fkey;

-- Add correct foreign key constraint referencing profiles table
ALTER TABLE public.job_completions 
ADD CONSTRAINT job_completions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Add trigger to job_progress for updated_at
DROP TRIGGER IF EXISTS update_job_progress_updated_at ON public.job_progress;

CREATE TRIGGER update_job_progress_updated_at
  BEFORE UPDATE ON public.job_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();