-- Create tables for the multi-agent system

-- Businesses table to store business information
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT,
  description TEXT,
  industry TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  research_status TEXT DEFAULT 'pending',
  research_data JSONB DEFAULT '{}',
  brand_guidelines JSONB DEFAULT '{}',
  auto_mode BOOLEAN DEFAULT false,
  languages TEXT[] DEFAULT ARRAY['en']
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Businesses select own or admin" 
ON public.businesses 
FOR SELECT 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Businesses insert own or admin" 
ON public.businesses 
FOR INSERT 
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Businesses update own or admin" 
ON public.businesses 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Businesses delete own or admin" 
ON public.businesses 
FOR DELETE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Agent tasks table to track what each agent is working on
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- 'master', 'research', 'copywriter', 'image', 'video', 'scheduler', 'customer_service', 'analytics'
  task_type TEXT NOT NULL, -- 'research', 'content_creation', 'scheduling', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  priority INTEGER DEFAULT 5,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "AgentTasks select own or admin" 
ON public.agent_tasks 
FOR SELECT 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "AgentTasks insert own or admin" 
ON public.agent_tasks 
FOR INSERT 
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "AgentTasks update own or admin" 
ON public.agent_tasks 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "AgentTasks delete own or admin" 
ON public.agent_tasks 
FOR DELETE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Content queue table for approval workflow
CREATE TABLE IF NOT EXISTS public.content_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'post', 'image', 'video', 'email'
  title TEXT,
  content TEXT,
  media_urls TEXT[],
  platforms TEXT[], -- ['twitter', 'linkedin', 'facebook', 'instagram']
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'published'
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.content_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "ContentQueue select own or admin" 
ON public.content_queue 
FOR SELECT 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ContentQueue insert own or admin" 
ON public.content_queue 
FOR INSERT 
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ContentQueue update own or admin" 
ON public.content_queue 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ContentQueue delete own or admin" 
ON public.content_queue 
FOR DELETE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Customer service conversations
CREATE TABLE IF NOT EXISTS public.customer_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'email', 'facebook', 'instagram', 'linkedin'
  external_id TEXT, -- ID from the platform
  customer_name TEXT,
  customer_email TEXT,
  language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'pending', 'closed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "CustomerConversations select own or admin" 
ON public.customer_conversations 
FOR SELECT 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CustomerConversations insert own or admin" 
ON public.customer_conversations 
FOR INSERT 
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CustomerConversations update own or admin" 
ON public.customer_conversations 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CustomerConversations delete own or admin" 
ON public.customer_conversations 
FOR DELETE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Customer service messages
CREATE TABLE IF NOT EXISTS public.customer_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.customer_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'customer', 'agent', 'ai'
  content TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  ai_suggested_reply TEXT,
  reply_approved BOOLEAN,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "CustomerMessages select if conversation visible" 
ON public.customer_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.customer_conversations c 
  WHERE c.id = customer_messages.conversation_id 
  AND ((c.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "CustomerMessages insert if conversation visible" 
ON public.customer_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.customer_conversations c 
  WHERE c.id = customer_messages.conversation_id 
  AND ((c.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "CustomerMessages update if conversation visible" 
ON public.customer_messages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.customer_conversations c 
  WHERE c.id = customer_messages.conversation_id 
  AND ((c.created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
));

-- Create updated_at triggers
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_tasks_updated_at
  BEFORE UPDATE ON public.agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_queue_updated_at
  BEFORE UPDATE ON public.content_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_conversations_updated_at
  BEFORE UPDATE ON public.customer_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();