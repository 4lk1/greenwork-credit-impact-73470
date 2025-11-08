-- Create function to update timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create job_progress table to track quiz attempts
CREATE TABLE public.job_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  microjob_id UUID NOT NULL,
  quiz_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_progress ENABLE ROW LEVEL SECURITY;

-- Public read/write access (can be restricted later when auth is added)
CREATE POLICY "Public read access for job_progress" 
ON public.job_progress 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for job_progress" 
ON public.job_progress 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access for job_progress" 
ON public.job_progress 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access for job_progress" 
ON public.job_progress 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_job_progress_microjob ON public.job_progress(microjob_id);

-- Trigger to update last_updated timestamp
CREATE TRIGGER update_job_progress_updated_at
BEFORE UPDATE ON public.job_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();