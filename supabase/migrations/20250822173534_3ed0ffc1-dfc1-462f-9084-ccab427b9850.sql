-- APEX Intelligence Layer Database Schema

-- Leads and Scoring
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  created_by UUID NOT NULL,
  
  -- Contact Information
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  
  -- Demographics
  age INTEGER,
  location TEXT,
  occupation TEXT,
  income_level TEXT,
  
  -- AI Scoring (1-100)
  ai_score INTEGER DEFAULT 0,
  qualification_status TEXT DEFAULT 'unscored'::TEXT,
  
  -- Psychographic Profile
  motivation_type TEXT, -- fear-driven, convenience-driven, etc
  decision_maker_type TEXT, -- decision-maker, influencer
  urgency_level TEXT, -- immediate, future, none
  pain_points JSONB DEFAULT '[]'::JSONB,
  
  -- Engagement Data
  email_quality_score INTEGER DEFAULT 0,
  social_activity_score INTEGER DEFAULT 0,
  website_visits INTEGER DEFAULT 0,
  last_engagement TIMESTAMP WITH TIME ZONE,
  
  -- Lifecycle
  status TEXT DEFAULT 'new'::TEXT, -- new, qualified, contacted, nurture, hot, cold, converted
  source TEXT, -- manual, ai-discovery, referral, etc
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Omnichannel Campaigns
CREATE TABLE public.outreach_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  created_by UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Campaign Configuration
  channels TEXT[] DEFAULT ARRAY['email']::TEXT[], -- email, linkedin, facebook, sms, direct_mail
  sequence_days INTEGER[] DEFAULT ARRAY[1,3,7,14,21]::INTEGER[],
  
  -- Targeting
  target_score_min INTEGER DEFAULT 70,
  target_demographics JSONB DEFAULT '{}'::JSONB,
  target_psychographics JSONB DEFAULT '{}'::JSONB,
  
  -- Performance
  total_leads INTEGER DEFAULT 0,
  responses_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  
  status TEXT DEFAULT 'draft'::TEXT, -- draft, active, paused, completed
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Outreach Sequences
CREATE TABLE public.outreach_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  
  -- Sequence Tracking
  current_step INTEGER DEFAULT 1,
  max_steps INTEGER DEFAULT 7,
  next_contact_date TIMESTAMP WITH TIME ZONE,
  
  -- Channel Strategy
  channels_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_channel TEXT DEFAULT 'email'::TEXT,
  
  -- AI Personalization
  personalized_approach TEXT,
  social_proof_elements JSONB DEFAULT '[]'::JSONB,
  urgency_triggers JSONB DEFAULT '[]'::JSONB,
  
  -- Performance
  total_touchpoints INTEGER DEFAULT 0,
  response_received BOOLEAN DEFAULT false,
  conversion_achieved BOOLEAN DEFAULT false,
  
  status TEXT DEFAULT 'active'::TEXT, -- active, paused, completed, failed
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversation Intelligence
CREATE TABLE public.lead_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  sequence_id UUID,
  
  -- Interaction Details
  channel TEXT NOT NULL, -- email, linkedin, facebook, phone, etc
  direction TEXT NOT NULL, -- outbound, inbound
  subject TEXT,
  content TEXT NOT NULL,
  
  -- AI Classification
  sentiment_score NUMERIC(3,2), -- -1.0 to 1.0
  intent_classification TEXT, -- interested, pricing, objection, not_interested, etc
  urgency_detected TEXT, -- high, medium, low
  next_action_recommended TEXT,
  
  -- Response Handling
  requires_human BOOLEAN DEFAULT false,
  auto_response_sent BOOLEAN DEFAULT false,
  auto_response_content TEXT,
  
  -- Tracking
  opened BOOLEAN DEFAULT false,
  clicked BOOLEAN DEFAULT false,
  replied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue Optimization
CREATE TABLE public.dynamic_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  
  -- Pricing Strategy
  base_price NUMERIC(10,2) NOT NULL,
  lead_score_multiplier NUMERIC(3,2) DEFAULT 1.0,
  urgency_multiplier NUMERIC(3,2) DEFAULT 1.0,
  seasonal_multiplier NUMERIC(3,2) DEFAULT 1.0,
  
  -- Market Conditions
  competitor_analysis JSONB DEFAULT '{}'::JSONB,
  market_demand_score INTEGER DEFAULT 50,
  
  -- Performance Data
  conversion_rates JSONB DEFAULT '{}'::JSONB,
  optimal_price_points JSONB DEFAULT '{}'::JSONB,
  
  active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictive Analytics
CREATE TABLE public.lead_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  
  -- Predictions
  lifetime_value_prediction NUMERIC(10,2),
  conversion_probability NUMERIC(3,2), -- 0.0 to 1.0
  optimal_contact_time TIME,
  optimal_contact_day INTEGER, -- 1-7 (Monday-Sunday)
  best_performing_channel TEXT,
  
  -- Confidence Scores
  ltv_confidence NUMERIC(3,2),
  conversion_confidence NUMERIC(3,2),
  timing_confidence NUMERIC(3,2),
  
  -- Model Metadata
  model_version TEXT DEFAULT '1.0',
  prediction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads
CREATE POLICY "Leads delete own or admin" ON public.leads FOR DELETE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Leads insert own or admin" ON public.leads FOR INSERT WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Leads select own or admin" ON public.leads FOR SELECT USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Leads update own or admin" ON public.leads FOR UPDATE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for campaigns
CREATE POLICY "Campaigns delete own or admin" ON public.outreach_campaigns FOR DELETE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Campaigns insert own or admin" ON public.outreach_campaigns FOR INSERT WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Campaigns select own or admin" ON public.outreach_campaigns FOR SELECT USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Campaigns update own or admin" ON public.outreach_campaigns FOR UPDATE USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for sequences
CREATE POLICY "Sequences delete if campaign visible" ON public.outreach_sequences FOR DELETE USING (EXISTS (SELECT 1 FROM outreach_campaigns c WHERE c.id = outreach_sequences.campaign_id AND ((c.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Sequences insert if campaign visible" ON public.outreach_sequences FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM outreach_campaigns c WHERE c.id = outreach_sequences.campaign_id AND ((c.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Sequences select if campaign visible" ON public.outreach_sequences FOR SELECT USING (EXISTS (SELECT 1 FROM outreach_campaigns c WHERE c.id = outreach_sequences.campaign_id AND ((c.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Sequences update if campaign visible" ON public.outreach_sequences FOR UPDATE USING (EXISTS (SELECT 1 FROM outreach_campaigns c WHERE c.id = outreach_sequences.campaign_id AND ((c.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));

-- RLS Policies for interactions
CREATE POLICY "Interactions delete if lead visible" ON public.lead_interactions FOR DELETE USING (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_interactions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Interactions insert if lead visible" ON public.lead_interactions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_interactions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Interactions select if lead visible" ON public.lead_interactions FOR SELECT USING (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_interactions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Interactions update if lead visible" ON public.lead_interactions FOR UPDATE USING (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_interactions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));

-- RLS Policies for pricing
CREATE POLICY "Pricing delete own or admin" ON public.dynamic_pricing FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Pricing insert own or admin" ON public.dynamic_pricing FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Pricing select own or admin" ON public.dynamic_pricing FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Pricing update own or admin" ON public.dynamic_pricing FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for predictions
CREATE POLICY "Predictions delete if lead visible" ON public.lead_predictions FOR DELETE USING (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_predictions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Predictions insert if lead visible" ON public.lead_predictions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_predictions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Predictions select if lead visible" ON public.lead_predictions FOR SELECT USING (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_predictions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
CREATE POLICY "Predictions update if lead visible" ON public.lead_predictions FOR UPDATE USING (EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_predictions.lead_id AND ((l.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));

-- Create update triggers
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.outreach_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON public.outreach_sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON public.dynamic_pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();