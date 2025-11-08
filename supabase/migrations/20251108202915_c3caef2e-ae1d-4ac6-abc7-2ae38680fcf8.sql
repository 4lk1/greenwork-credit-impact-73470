-- Fix security issue: Remove public read access to job_completions
-- Users should only see their own completion data
DROP POLICY IF EXISTS "Public can view all completions for stats" ON job_completions;

-- Fix security issue: Remove public insert access to verification_codes
-- This prevents spam and abuse of the verification system
DROP POLICY IF EXISTS "Anyone can create verification codes" ON verification_codes;

-- Create a public view for anonymized aggregate statistics
-- This provides the stats functionality without exposing individual user data
CREATE OR REPLACE VIEW public.job_stats AS
SELECT 
  COUNT(*) as total_jobs,
  SUM(earned_credits) as total_credits,
  SUM(estimated_co2_kg_impact) as total_co2_impact,
  AVG(quiz_score_percent) as avg_score
FROM job_completions;

-- Grant select access on the view to authenticated users
GRANT SELECT ON public.job_stats TO authenticated;