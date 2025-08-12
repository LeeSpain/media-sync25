-- Create video tables and enums for the video pipeline

-- Enums
DO $$ BEGIN
  CREATE TYPE public.video_status AS ENUM ('processing','ready','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.video_job_status AS ENUM ('queued','completed','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.video_job_type AS ENUM ('generate_script','generate_scenes','generate_tts','assemble','upload');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  company_name text,
  type text NOT NULL,
  style text,
  status public.video_status NOT NULL DEFAULT 'processing',
  script jsonb NOT NULL DEFAULT '{}'::jsonb,
  title text,
  duration_seconds integer,
  video_url text,
  thumbnail_url text,
  size_bytes bigint
);

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Policies: own or admin
CREATE POLICY IF NOT EXISTS "Videos select own or admin"
ON public.videos FOR SELECT
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Videos insert own or admin"
ON public.videos FOR INSERT
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Videos update own or admin"
ON public.videos FOR UPDATE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Videos delete own or admin"
ON public.videos FOR DELETE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- video_jobs table
CREATE TABLE IF NOT EXISTS public.video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  job_type public.video_job_type NOT NULL,
  status public.video_job_status NOT NULL DEFAULT 'queued',
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text
);

ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "VideoJobs select own or admin"
ON public.video_jobs FOR SELECT
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "VideoJobs insert own or admin"
ON public.video_jobs FOR INSERT
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "VideoJobs update own or admin"
ON public.video_jobs FOR UPDATE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "VideoJobs delete own or admin"
ON public.video_jobs FOR DELETE
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_video_jobs_video_id ON public.video_jobs(video_id);
