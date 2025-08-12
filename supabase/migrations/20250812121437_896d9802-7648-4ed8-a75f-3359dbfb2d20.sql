
-- 1) Enums
CREATE TYPE public.email_campaign_status AS ENUM ('draft','scheduled','sending','sent','paused','canceled');

CREATE TYPE public.email_recipient_status AS ENUM (
  'queued','sending','delivered','opened','clicked','bounced','complained','unsubscribed','failed'
);

CREATE TYPE public.email_event_type AS ENUM (
  'delivered','open','click','bounce','complaint','unsubscribe','spamreport','reject'
);

-- 2) Templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EmailTemplates select own or admin"
  ON public.email_templates
  FOR SELECT
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailTemplates insert own or admin"
  ON public.email_templates
  FOR INSERT
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailTemplates update own or admin"
  ON public.email_templates
  FOR UPDATE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailTemplates delete own or admin"
  ON public.email_templates
  FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Campaigns
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_for TIMESTAMPTZ,
  timezone TEXT,
  status public.email_campaign_status NOT NULL DEFAULT 'draft',
  provider TEXT,
  statistics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns
  ADD CONSTRAINT email_campaigns_template_fk
  FOREIGN KEY (template_id) REFERENCES public.email_templates(id) ON DELETE SET NULL;

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EmailCampaigns select own or admin"
  ON public.email_campaigns
  FOR SELECT
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailCampaigns insert own or admin"
  ON public.email_campaigns
  FOR INSERT
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailCampaigns update own or admin"
  ON public.email_campaigns
  FOR UPDATE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailCampaigns delete own or admin"
  ON public.email_campaigns
  FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX email_campaigns_created_by_idx ON public.email_campaigns (created_by);
CREATE INDEX email_campaigns_status_idx ON public.email_campaigns (status);
CREATE INDEX email_campaigns_scheduled_for_idx ON public.email_campaigns (scheduled_for);

-- 4) Campaign Variants (for A/B testing)
CREATE TABLE public.email_campaign_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  variant_key TEXT NOT NULL,
  percentage INTEGER NOT NULL DEFAULT 50,
  subject TEXT,
  html TEXT,
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaign_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EmailVariants select if campaign visible"
  ON public.email_campaign_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_campaign_variants.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "EmailVariants insert if campaign visible"
  ON public.email_campaign_variants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_campaign_variants.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "EmailVariants update if campaign visible"
  ON public.email_campaign_variants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_campaign_variants.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "EmailVariants delete if campaign visible"
  ON public.email_campaign_variants
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_campaign_variants.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE TRIGGER update_email_campaign_variants_updated_at
BEFORE UPDATE ON public.email_campaign_variants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX email_campaign_variants_campaign_idx ON public.email_campaign_variants (campaign_id);

-- 5) Recipients (per-campaign audience + delivery status)
CREATE TABLE public.email_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,
  variant_key TEXT,
  status public.email_recipient_status NOT NULL DEFAULT 'queued',
  last_event_at TIMESTAMPTZ,
  event_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  message_id TEXT,
  error TEXT,
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (unsubscribe_token)
);

ALTER TABLE public.email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EmailRecipients visible if campaign visible"
  ON public.email_recipients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_recipients.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "EmailRecipients insert if campaign visible"
  ON public.email_recipients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_recipients.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "EmailRecipients update if campaign visible"
  ON public.email_recipients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_recipients.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "EmailRecipients delete if campaign visible"
  ON public.email_recipients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = email_recipients.campaign_id
        AND (c.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE TRIGGER update_email_recipients_updated_at
BEFORE UPDATE ON public.email_recipients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX email_recipients_campaign_idx ON public.email_recipients (campaign_id);
CREATE INDEX email_recipients_status_idx ON public.email_recipients (status);

-- 6) Events (opens, clicks, bounces, complaints, unsubscribes)
CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  campaign_id UUID,
  recipient_id UUID,
  event_type public.email_event_type NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EmailEvents select own or admin"
  ON public.email_events
  FOR SELECT
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailEvents insert own or admin"
  ON public.email_events
  FOR INSERT
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 7) Suppressions (per workspace/user)
CREATE TABLE public.email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  email TEXT NOT NULL,
  reason TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (created_by, email)
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "EmailSuppressions select own or admin"
  ON public.email_suppressions
  FOR SELECT
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailSuppressions insert own or admin"
  ON public.email_suppressions
  FOR INSERT
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailSuppressions update own or admin"
  ON public.email_suppressions
  FOR UPDATE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "EmailSuppressions delete own or admin"
  ON public.email_suppressions
  FOR DELETE
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Helpful indexes
CREATE INDEX email_events_campaign_idx ON public.email_events (campaign_id, event_type, occurred_at);
CREATE INDEX email_suppressions_created_by_idx ON public.email_suppressions (created_by, email);
