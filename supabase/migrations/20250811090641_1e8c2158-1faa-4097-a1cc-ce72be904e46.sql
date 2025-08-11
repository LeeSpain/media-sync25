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

-- Recreate policies to ensure correctness
DROP POLICY IF EXISTS "Onboarding select own or admin" ON public.onboarding;
DROP POLICY IF EXISTS "Onboarding insert own or admin" ON public.onboarding;
DROP POLICY IF EXISTS "Onboarding update own or admin" ON public.onboarding;
DROP POLICY IF EXISTS "Onboarding delete own or admin" ON public.onboarding;

CREATE POLICY "Onboarding select own or admin"
  ON public.onboarding
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Onboarding insert own or admin"
  ON public.onboarding
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Onboarding update own or admin"
  ON public.onboarding
  FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Onboarding delete own or admin"
  ON public.onboarding
  FOR DELETE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_onboarding_updated_at'
  ) THEN
    CREATE TRIGGER update_onboarding_updated_at
    BEFORE UPDATE ON public.onboarding
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;