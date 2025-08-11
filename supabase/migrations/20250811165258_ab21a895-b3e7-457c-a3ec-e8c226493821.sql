
-- Enums for content and workflow
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_kind') THEN
    CREATE TYPE public.content_kind AS ENUM ('social_post','email','sms','whatsapp','youtube_script','youtube_video');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'distribution_channel') THEN
    CREATE TYPE public.distribution_channel AS ENUM ('social','email','sms','whatsapp','youtube');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
    CREATE TYPE public.content_status AS ENUM ('draft','generated','approved','scheduled','published','failed','archived');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status') THEN
    CREATE TYPE public.schedule_status AS ENUM ('scheduled','queued','running','published','failed','canceled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'research_status') THEN
    CREATE TYPE public.research_status AS ENUM ('pending','in_progress','completed','failed');
  END IF;
END$$;


-- 1) Company Research: crawled data + AI analysis
CREATE TABLE IF NOT EXISTS public.company_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  company_id UUID NOT NULL,
  source_url TEXT,
  raw_content TEXT,
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_voice JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_pillars JSONB NOT NULL DEFAULT '{}'::jsonb,
  competitors JSONB NOT NULL DEFAULT '[]'::jsonb,
  industry_trends JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.research_status NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_company_research_created_by ON public.company_research (created_by);
CREATE INDEX IF NOT EXISTS idx_company_research_company_id ON public.company_research (company_id);

CREATE TRIGGER company_research_set_updated_at
BEFORE UPDATE ON public.company_research
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.company_research ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='company_research' AND policyname='CompanyResearch select own or admin'
  ) THEN
    CREATE POLICY "CompanyResearch select own or admin"
      ON public.company_research
      FOR SELECT
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='company_research' AND policyname='CompanyResearch insert own or admin'
  ) THEN
    CREATE POLICY "CompanyResearch insert own or admin"
      ON public.company_research
      FOR INSERT
      WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='company_research' AND policyname='CompanyResearch update own or admin'
  ) THEN
    CREATE POLICY "CompanyResearch update own or admin"
      ON public.company_research
      FOR UPDATE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='company_research' AND policyname='CompanyResearch delete own or admin'
  ) THEN
    CREATE POLICY "CompanyResearch delete own or admin"
      ON public.company_research
      FOR DELETE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;


-- 2) Content Items: generated content across channels
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  company_id UUID NOT NULL,
  research_id UUID NULL,
  kind public.content_kind NOT NULL,
  channel public.distribution_channel NOT NULL,
  title TEXT,
  content TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status public.content_status NOT NULL DEFAULT 'draft',
  agent_id UUID NULL,
  campaign_id UUID NULL
);

CREATE INDEX IF NOT EXISTS idx_content_items_created_by ON public.content_items (created_by);
CREATE INDEX IF NOT EXISTS idx_content_items_company_id ON public.content_items (company_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items (status);

CREATE TRIGGER content_items_set_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_items' AND policyname='ContentItems select own or admin'
  ) THEN
    CREATE POLICY "ContentItems select own or admin"
      ON public.content_items
      FOR SELECT
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_items' AND policyname='ContentItems insert own or admin'
  ) THEN
    CREATE POLICY "ContentItems insert own or admin"
      ON public.content_items
      FOR INSERT
      WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_items' AND policyname='ContentItems update own or admin'
  ) THEN
    CREATE POLICY "ContentItems update own or admin"
      ON public.content_items
      FOR UPDATE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_items' AND policyname='ContentItems delete own or admin'
  ) THEN
    CREATE POLICY "ContentItems delete own or admin"
      ON public.content_items
      FOR DELETE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;


-- 3) Content Schedule: when/where content will be published
CREATE TABLE IF NOT EXISTS public.content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  content_id UUID NOT NULL,
  channel public.distribution_channel NOT NULL,
  connected_account_id UUID NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status public.schedule_status NOT NULL DEFAULT 'scheduled',
  publish_result JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_content_schedule_created_by ON public.content_schedule (created_by);
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled_for ON public.content_schedule (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON public.content_schedule (status);

CREATE TRIGGER content_schedule_set_updated_at
BEFORE UPDATE ON public.content_schedule
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_schedule' AND policyname='ContentSchedule select own or admin'
  ) THEN
    CREATE POLICY "ContentSchedule select own or admin"
      ON public.content_schedule
      FOR SELECT
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_schedule' AND policyname='ContentSchedule insert own or admin'
  ) THEN
    CREATE POLICY "ContentSchedule insert own or admin"
      ON public.content_schedule
      FOR INSERT
      WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_schedule' AND policyname='ContentSchedule update own or admin'
  ) THEN
    CREATE POLICY "ContentSchedule update own or admin"
      ON public.content_schedule
      FOR UPDATE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='content_schedule' AND policyname='ContentSchedule delete own or admin'
  ) THEN
    CREATE POLICY "ContentSchedule delete own or admin"
      ON public.content_schedule
      FOR DELETE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;


-- 4) Connected Accounts: per-user/provider credentials & metadata
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'twitter', 'linkedin', 'gmail', 'smtp', 'youtube', 'whatsapp', 'twilio'
  account_id TEXT NULL,
  account_name TEXT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  access_token TEXT NULL,
  refresh_token TEXT NULL,
  expires_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'connected'
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_created_by ON public.connected_accounts (created_by);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_provider ON public.connected_accounts (provider);

CREATE TRIGGER connected_accounts_set_updated_at
BEFORE UPDATE ON public.connected_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='connected_accounts' AND policyname='ConnectedAccounts select own or admin'
  ) THEN
    CREATE POLICY "ConnectedAccounts select own or admin"
      ON public.connected_accounts
      FOR SELECT
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='connected_accounts' AND policyname='ConnectedAccounts insert own or admin'
  ) THEN
    CREATE POLICY "ConnectedAccounts insert own or admin"
      ON public.connected_accounts
      FOR INSERT
      WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='connected_accounts' AND policyname='ConnectedAccounts update own or admin'
  ) THEN
    CREATE POLICY "ConnectedAccounts update own or admin"
      ON public.connected_accounts
      FOR UPDATE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='connected_accounts' AND policyname='ConnectedAccounts delete own or admin'
  ) THEN
    CREATE POLICY "ConnectedAccounts delete own or admin"
      ON public.connected_accounts
      FOR DELETE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;


-- 5) Publish Jobs: execution log for publishing attempts
CREATE TABLE IF NOT EXISTS public.publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  content_id UUID NULL,
  schedule_id UUID NULL,
  provider TEXT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT NULL,
  response JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_publish_jobs_created_by ON public.publish_jobs (created_by);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status ON public.publish_jobs (status);

ALTER TABLE public.publish_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='publish_jobs' AND policyname='PublishJobs select own or admin'
  ) THEN
    CREATE POLICY "PublishJobs select own or admin"
      ON public.publish_jobs
      FOR SELECT
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='publish_jobs' AND policyname='PublishJobs insert own or admin'
  ) THEN
    CREATE POLICY "PublishJobs insert own or admin"
      ON public.publish_jobs
      FOR INSERT
      WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='publish_jobs' AND policyname='PublishJobs update own or admin'
  ) THEN
    CREATE POLICY "PublishJobs update own or admin"
      ON public.publish_jobs
      FOR UPDATE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='publish_jobs' AND policyname='PublishJobs delete own or admin'
  ) THEN
    CREATE POLICY "PublishJobs delete own or admin"
      ON public.publish_jobs
      FOR DELETE
      USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;


-- 6) Platform Settings: admin-only global config (key/value)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

CREATE TRIGGER platform_settings_set_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='platform_settings' AND policyname='PlatformSettings admin select'
  ) THEN
    CREATE POLICY "PlatformSettings admin select"
      ON public.platform_settings
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='platform_settings' AND policyname='PlatformSettings admin insert'
  ) THEN
    CREATE POLICY "PlatformSettings admin insert"
      ON public.platform_settings
      FOR INSERT
      WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='platform_settings' AND policyname='PlatformSettings admin update'
  ) THEN
    CREATE POLICY "PlatformSettings admin update"
      ON public.platform_settings
      FOR UPDATE
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='platform_settings' AND policyname='PlatformSettings admin delete'
  ) THEN
    CREATE POLICY "PlatformSettings admin delete"
      ON public.platform_settings
      FOR DELETE
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END$$;
