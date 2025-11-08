-- Create country_scores table
CREATE TABLE public.country_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iso_country TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  climate_indicator NUMERIC NOT NULL,
  inequality_indicator NUMERIC NOT NULL,
  internet_users_pct NUMERIC NOT NULL,
  climate_need_score NUMERIC NOT NULL,
  inequality_score NUMERIC NOT NULL,
  priority_score NUMERIC NOT NULL,
  recommended_microjob_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.country_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access for country_scores" 
ON public.country_scores 
FOR SELECT 
USING (true);