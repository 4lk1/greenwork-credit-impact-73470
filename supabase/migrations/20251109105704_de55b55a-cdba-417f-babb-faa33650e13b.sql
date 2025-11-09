-- Add public read access to job_completions for leaderboard
-- This allows users to see all job completions for leaderboard rankings
-- while keeping write operations restricted to own records

CREATE POLICY "Anyone can view job completions for leaderboard"
ON public.job_completions
FOR SELECT
TO authenticated
USING (true);

-- Note: The existing "Users can view own completions" policy will coexist
-- PostgreSQL will allow access if ANY policy permits it