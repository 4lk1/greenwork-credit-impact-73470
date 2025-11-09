-- Create enums for task and checkin status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'done');
CREATE TYPE public.worker_status AS ENUM ('idle', 'active', 'paused', 'finished');

-- Create job_tasks table
CREATE TABLE public.job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.micro_jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  depends_on UUID[] DEFAULT ARRAY[]::UUID[],
  status public.task_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create worker_checkins table
CREATE TABLE public.worker_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.micro_jobs(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status public.worker_status NOT NULL DEFAULT 'active',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_job_tasks_job_id ON public.job_tasks(job_id);
CREATE INDEX idx_job_tasks_assigned_to ON public.job_tasks(assigned_to);
CREATE INDEX idx_job_tasks_status ON public.job_tasks(status);
CREATE INDEX idx_worker_checkins_worker_id ON public.worker_checkins(worker_id);
CREATE INDEX idx_worker_checkins_job_id ON public.worker_checkins(job_id);
CREATE INDEX idx_worker_checkins_timestamp ON public.worker_checkins(timestamp DESC);

-- Enable RLS
ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_tasks
CREATE POLICY "Everyone can read job_tasks for active jobs"
  ON public.job_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.micro_jobs
      WHERE id = job_tasks.job_id AND is_active = true
    )
  );

CREATE POLICY "Workers can update their assigned tasks"
  ON public.job_tasks
  FOR UPDATE
  USING (auth.uid() = assigned_to);

CREATE POLICY "Authenticated users can insert tasks"
  ON public.job_tasks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for worker_checkins
CREATE POLICY "Workers can insert their own checkins"
  ON public.worker_checkins
  FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can read their own checkins"
  ON public.worker_checkins
  FOR SELECT
  USING (auth.uid() = worker_id);

CREATE POLICY "All authenticated users can read all checkins"
  ON public.worker_checkins
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at on job_tasks
CREATE TRIGGER update_job_tasks_updated_at
  BEFORE UPDATE ON public.job_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_checkins;