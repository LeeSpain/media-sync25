-- Create types for video and job statuses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_status') THEN
    CREATE TYPE public.video_status AS ENUM ('draft','queued','processing','ready','failed','published');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_job_type') THEN
    CREATE TYPE public.video_job_type AS ENUM ('generate_script','generate_scenes','generate_tts','assemble','publish');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE public.job_status AS ENUM ('queued','running','completed','failed');
  END IF;
END $$;

-- Videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  title text,
  description text,
  company_name text,
  type text,
  style text,
  status public.video_status NOT NULL DEFAULT 'queued',
  script jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_seconds integer,
  video_url text,
  thumbnail_url text,
  size_bytes bigint,
  published_url text
);

-- Enable RLS and policies for videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='videos' AND policyname='Videos select own or admin'
  ) THEN
    CREATE POLICY "Videos select own or admin" ON public.videos
      FOR SELECT USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='videos' AND policyname='Videos insert own or admin'
  ) THEN
    CREATE POLICY "Videos insert own or admin" ON public.videos
      FOR INSERT WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='videos' AND policyname='Videos update own or admin'
  ) THEN
    CREATE POLICY "Videos update own or admin" ON public.videos
      FOR UPDATE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='videos' AND policyname='Videos delete own or admin'
  ) THEN
    CREATE POLICY "Videos delete own or admin" ON public.videos
      FOR DELETE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table='videos' AND trigger_name='update_videos_updated_at'
  ) THEN
    CREATE TRIGGER update_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Video jobs table
CREATE TABLE IF NOT EXISTS public.video_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  job_type public.video_job_type NOT NULL,
  status public.job_status NOT NULL DEFAULT 'queued',
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_jobs' AND policyname='VideoJobs select own or admin'
  ) THEN
    CREATE POLICY "VideoJobs select own or admin" ON public.video_jobs
      FOR SELECT USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_jobs' AND policyname='VideoJobs insert own or admin'
  ) THEN
    CREATE POLICY "VideoJobs insert own or admin" ON public.video_jobs
      FOR INSERT WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_jobs' AND policyname='VideoJobs update own or admin'
  ) THEN
    CREATE POLICY "VideoJobs update own or admin" ON public.video_jobs
      FOR UPDATE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_jobs' AND policyname='VideoJobs delete own or admin'
  ) THEN
    CREATE POLICY "VideoJobs delete own or admin" ON public.video_jobs
      FOR DELETE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers WHERE event_object_table='video_jobs' AND trigger_name='update_video_jobs_updated_at'
  ) THEN
    CREATE TRIGGER update_video_jobs_updated_at
    BEFORE UPDATE ON public.video_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Storage: create videos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'videos' bucket
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read access for videos bucket'
  ) THEN
    CREATE POLICY "Public read access for videos bucket"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'videos');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can upload to their folder in videos bucket'
  ) THEN
    CREATE POLICY "Users can upload to their folder in videos bucket"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'videos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can update their files in videos bucket'
  ) THEN
    CREATE POLICY "Users can update their files in videos bucket"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'videos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'videos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Users can delete their files in videos bucket'
  ) THEN
    CREATE POLICY "Users can delete their files in videos bucket"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'videos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;