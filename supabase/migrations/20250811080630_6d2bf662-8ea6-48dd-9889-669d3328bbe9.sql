
-- Enums
create type public.deal_status as enum ('open','won','lost');
create type public.activity_type as enum ('call','email','meeting','note','task','sms','whatsapp','social_dm','other');
create type public.campaign_status as enum ('draft','active','paused','completed');
create type public.engagement_channel as enum ('email','whatsapp','sms','social','site','other');
create type public.engagement_event_type as enum (
  'sent','delivered','opened','clicked','replied','bounced','unsubscribed',
  'message_received','message_sent','comment','like','share'
);

-- Companies
create table public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  name text not null,
  website text,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contacts
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  company_id uuid references public.crm_companies(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  job_title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tags and M2M for contacts
create table public.crm_tags (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, name)
);

create table public.crm_contact_tags (
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  tag_id uuid not null references public.crm_tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- Pipelines and stages
create table public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.crm_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.crm_pipelines(id) on delete cascade,
  created_by uuid not null,
  name text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Deals
create table public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  title text not null,
  value numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status public.deal_status not null default 'open',
  contact_id uuid references public.crm_contacts(id) on delete set null,
  company_id uuid references public.crm_companies(id) on delete set null,
  pipeline_id uuid references public.crm_pipelines(id) on delete set null,
  stage_id uuid references public.crm_stages(id) on delete set null,
  expected_close_date date,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Activities linked to contacts/deals
create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  type public.activity_type not null,
  subject text,
  content text,
  due_at timestamptz,
  completed_at timestamptz,
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Campaigns (Planner)
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  name text not null,
  description text,
  status public.campaign_status not null default 'draft',
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Engagement events (cross-channel touches)
create table public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  channel public.engagement_channel not null,
  event_type public.engagement_event_type not null,
  occurred_at timestamptz not null default now(),
  content_preview text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index on public.crm_companies (created_by);
create index on public.crm_contacts (created_by);
create index on public.crm_deals (created_by, status);
create index on public.crm_deals (pipeline_id, stage_id);
create index on public.crm_activities (created_by, type);
create index on public.campaigns (created_by, status);
create index on public.engagement_events (created_by, contact_id, occurred_at desc);

-- RLS
alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_tags enable row level security;
alter table public.crm_contact_tags enable row level security;
alter table public.crm_pipelines enable row level security;
alter table public.crm_stages enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;
alter table public.campaigns enable row level security;
alter table public.engagement_events enable row level security;

-- Policies: creator-only, admins can do all
-- Companies
create policy "Companies select own or admin"
  on public.crm_companies for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Companies insert own or admin"
  on public.crm_companies for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Companies update own or admin"
  on public.crm_companies for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Companies delete own or admin"
  on public.crm_companies for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Contacts
create policy "Contacts select own or admin"
  on public.crm_contacts for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Contacts insert own or admin"
  on public.crm_contacts for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Contacts update own or admin"
  on public.crm_contacts for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Contacts delete own or admin"
  on public.crm_contacts for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Tags
create policy "Tags select own or admin"
  on public.crm_tags for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Tags insert own or admin"
  on public.crm_tags for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Tags update own or admin"
  on public.crm_tags for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Tags delete own or admin"
  on public.crm_tags for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Contact tags M2M (enforce via subqueries)
create policy "ContactTags select if contact visible"
  on public.crm_contact_tags for select
  using (
    exists (select 1 from public.crm_contacts c where c.id = contact_id and (c.created_by = auth.uid() or has_role(auth.uid(), 'admin')))
  );
create policy "ContactTags insert if contact visible"
  on public.crm_contact_tags for insert
  with check (
    exists (select 1 from public.crm_contacts c where c.id = contact_id and (c.created_by = auth.uid() or has_role(auth.uid(), 'admin')))
    and exists (select 1 from public.crm_tags t where t.id = tag_id and (t.created_by = auth.uid() or has_role(auth.uid(), 'admin')))
  );
create policy "ContactTags delete if contact visible"
  on public.crm_contact_tags for delete
  using (
    exists (select 1 from public.crm_contacts c where c.id = contact_id and (c.created_by = auth.uid() or has_role(auth.uid(), 'admin')))
  );

-- Pipelines
create policy "Pipelines select own or admin"
  on public.crm_pipelines for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Pipelines insert own or admin"
  on public.crm_pipelines for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Pipelines update own or admin"
  on public.crm_pipelines for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Pipelines delete own or admin"
  on public.crm_pipelines for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Stages
create policy "Stages select own or admin"
  on public.crm_stages for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Stages insert own or admin"
  on public.crm_stages for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Stages update own or admin"
  on public.crm_stages for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Stages delete own or admin"
  on public.crm_stages for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Deals
create policy "Deals select own or admin"
  on public.crm_deals for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Deals insert own or admin"
  on public.crm_deals for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Deals update own or admin"
  on public.crm_deals for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Deals delete own or admin"
  on public.crm_deals for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Activities
create policy "Activities select own or admin"
  on public.crm_activities for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Activities insert own or admin"
  on public.crm_activities for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Activities update own or admin"
  on public.crm_activities for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Activities delete own or admin"
  on public.crm_activities for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Campaigns
create policy "Campaigns select own or admin"
  on public.campaigns for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Campaigns insert own or admin"
  on public.campaigns for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Campaigns update own or admin"
  on public.campaigns for update
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Campaigns delete own or admin"
  on public.campaigns for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- Engagement events
create policy "Events select own or admin"
  on public.engagement_events for select
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Events insert own or admin"
  on public.engagement_events for insert
  with check (created_by = auth.uid() or has_role(auth.uid(), 'admin'));
create policy "Events delete own or admin"
  on public.engagement_events for delete
  using (created_by = auth.uid() or has_role(auth.uid(), 'admin'));

-- updated_at triggers
create trigger set_timestamp before update on public.crm_companies    for each row execute function public.update_updated_at_column();
create trigger set_timestamp before update on public.crm_contacts     for each row execute function public.update_updated_at_column();
create trigger set_timestamp before update on public.crm_tags         for each row execute function public.update_updated_at_column();
create trigger set_timestamp before update on public.crm_pipelines    for each row execute function public.update_updated_at_column();
create trigger set_timestamp before update on public.crm_stages       for each row execute function public.update_updated_at_column();
create trigger set_timestamp before update on public.crm_deals        for each row execute function public.update_updated_at_column();
create trigger set_timestamp before update on public.crm_activities   for each row execute function public.update_updated_at_column();
create trigger set_timestamp before update on public.campaigns        for each row execute function public.update_updated_at_column();

-- Realtime
alter table public.crm_companies      replica identity full;
alter table public.crm_contacts       replica identity full;
alter table public.crm_deals          replica identity full;
alter table public.crm_activities     replica identity full;
alter table public.campaigns          replica identity full;
alter table public.engagement_events  replica identity full;

alter publication supabase_realtime add table
  public.crm_companies,
  public.crm_contacts,
  public.crm_deals,
  public.crm_activities,
  public.campaigns,
  public.engagement_events;
