-- Create onboarding table to persist business onboarding data per user
create table if not exists public.onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.onboarding enable row level security;

-- Create policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding' AND polname = 'Onboarding select own or admin'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Onboarding select own or admin"
      ON public.onboarding
      FOR SELECT
      USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding' AND polname = 'Onboarding insert own or admin'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Onboarding insert own or admin"
      ON public.onboarding
      FOR INSERT
      WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding' AND polname = 'Onboarding update own or admin'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Onboarding update own or admin"
      ON public.onboarding
      FOR UPDATE
      USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
    $$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding' AND polname = 'Onboarding delete own or admin'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Onboarding delete own or admin"
      ON public.onboarding
      FOR DELETE
      USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
    $$;
  END IF;
END $$;

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_onboarding_updated_at'
  ) THEN
    EXECUTE $$
      CREATE TRIGGER update_onboarding_updated_at
      BEFORE UPDATE ON public.onboarding
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column()
    $$;
  END IF;
END $$;