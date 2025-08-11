-- AI Platform schema for Admin controls
-- 1) Create tables

-- ai_agents: core agent definitions
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  name text NOT NULL,
  description text,
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  temperature numeric NOT NULL DEFAULT 0.2,
  instructions text,
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  avatar_url text
);

-- ai_tools: declarative tools the platform exposes to agents
CREATE TABLE IF NOT EXISTS public.ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  requires_secret boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ai_agent_tools: mapping between agents and tools
CREATE TABLE IF NOT EXISTS public.ai_agent_tools (
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.ai_tools(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, tool_id)
);

-- ai_knowledge_sources: data sources available to agents (RAG configs, URLs, etc.)
CREATE TABLE IF NOT EXISTS public.ai_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL, -- url | file | table | manual | webhook | other
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true
);

-- ai_conversations: conversation sessions with an agent
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  title text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ai_messages: messages inside a conversation
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL, -- system | user | assistant | tool
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ai_logs: operational logs for agents & tool calls
CREATE TABLE IF NOT EXISTS public.ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'info', -- debug | info | warn | error
  event text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 2) Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- 3) Admin-only policies using has_role()
-- Agents
DROP POLICY IF EXISTS "ai_agents admin all" ON public.ai_agents;
CREATE POLICY "ai_agents admin all"
ON public.ai_agents
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Tools
DROP POLICY IF EXISTS "ai_tools admin all" ON public.ai_tools;
CREATE POLICY "ai_tools admin all"
ON public.ai_tools
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Agent Tools
DROP POLICY IF EXISTS "ai_agent_tools admin all" ON public.ai_agent_tools;
CREATE POLICY "ai_agent_tools admin all"
ON public.ai_agent_tools
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Knowledge Sources
DROP POLICY IF EXISTS "ai_knowledge_sources admin all" ON public.ai_knowledge_sources;
CREATE POLICY "ai_knowledge_sources admin all"
ON public.ai_knowledge_sources
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Conversations
DROP POLICY IF EXISTS "ai_conversations admin all" ON public.ai_conversations;
CREATE POLICY "ai_conversations admin all"
ON public.ai_conversations
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Messages
DROP POLICY IF EXISTS "ai_messages admin all" ON public.ai_messages;
CREATE POLICY "ai_messages admin all"
ON public.ai_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Logs
DROP POLICY IF EXISTS "ai_logs admin all" ON public.ai_logs;
CREATE POLICY "ai_logs admin all"
ON public.ai_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4) updated_at triggers
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_agents_updated_at'
  ) THEN
    CREATE TRIGGER trg_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_tools_updated_at'
  ) THEN
    CREATE TRIGGER trg_ai_tools_updated_at
    BEFORE UPDATE ON public.ai_tools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_knowledge_sources_updated_at'
  ) THEN
    CREATE TRIGGER trg_ai_knowledge_sources_updated_at
    BEFORE UPDATE ON public.ai_knowledge_sources
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_conversations_updated_at'
  ) THEN
    CREATE TRIGGER trg_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ai_agents_created_by ON public.ai_agents(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON public.ai_agents(active);
CREATE INDEX IF NOT EXISTS idx_ai_tools_slug ON public.ai_tools(slug);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_sources_agent ON public.ai_knowledge_sources(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_agent ON public.ai_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_agent ON public.ai_logs(agent_id);
