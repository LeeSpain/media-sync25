-- Add from_address to email_campaigns to support scheduled send from address
ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS from_address text;

-- Enable required extensions for scheduling HTTP calls
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Schedule the email processor to run every 2 minutes
-- Note: This will invoke the edge function endpoint; make sure the function exists
select
  cron.schedule(
    'email-process-scheduled-every-2-min',
    '*/2 * * * *',
    $$
    select
      net.http_post(
        url := 'https://hzviynazgmbvdinbyxbx.supabase.co/functions/v1/email-process-scheduled',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object('invoked_at', now())
      ) as request_id;
    $$
  );