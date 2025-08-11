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

-- Policies: user can manage own row, admins can manage all
create policy if not exists "Onboarding select own or admin"
  on public.onboarding
  for select
  using (auth.uid() = user_id or has_role(auth.uid(), 'admin'));

create policy if not exists "Onboarding insert own or admin"
  on public.onboarding
  for insert
  with check (auth.uid() = user_id or has_role(auth.uid(), 'admin'));

create policy if not exists "Onboarding update own or admin"
  on public.onboarding
  for update
  using (auth.uid() = user_id or has_role(auth.uid(), 'admin'));

create policy if not exists "Onboarding delete own or admin"
  on public.onboarding
  for delete
  using (auth.uid() = user_id or has_role(auth.uid(), 'admin'));

-- Trigger to maintain updated_at
create trigger if not exists update_onboarding_updated_at
before update on public.onboarding
for each row
execute function public.update_updated_at_column();