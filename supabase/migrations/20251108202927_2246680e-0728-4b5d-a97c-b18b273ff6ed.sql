-- Fix security definer view issue
-- Use SECURITY INVOKER so the view respects the querying user's permissions
DROP VIEW IF EXISTS public.job_stats;

CREATE VIEW public.job_stats 
WITH (security_invoker = true)
AS
SELECT 
  COUNT(*) as total_jobs,
  SUM(earned_credits) as total_credits,
  SUM(estimated_co2_kg_impact) as total_co2_impact,
  AVG(quiz_score_percent) as avg_score
FROM job_completions;

-- Grant select access on the view to authenticated users
GRANT SELECT ON public.job_stats TO authenticated;