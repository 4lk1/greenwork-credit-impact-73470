-- Create quiz_scores table to track user quiz performance
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  percentage NUMERIC GENERATED ALWAYS AS (ROUND((score::NUMERIC / total_questions::NUMERIC) * 100, 2)) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster leaderboard queries
CREATE INDEX idx_quiz_scores_user_id ON public.quiz_scores(user_id);
CREATE INDEX idx_quiz_scores_percentage ON public.quiz_scores(percentage DESC);
CREATE INDEX idx_quiz_scores_created_at ON public.quiz_scores(created_at DESC);

-- Enable RLS
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Users can insert their own scores
CREATE POLICY "Users can insert own quiz scores"
ON public.quiz_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Everyone can view all scores (public leaderboard)
CREATE POLICY "Public read access for quiz scores"
ON public.quiz_scores
FOR SELECT
USING (true);

-- Users can view their own scores
CREATE POLICY "Users can view own quiz scores"
ON public.quiz_scores
FOR SELECT
USING (auth.uid() = user_id);