-- Enable realtime for content_queue table
ALTER TABLE public.content_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_queue;

-- Enable realtime for connected_accounts table  
ALTER TABLE public.connected_accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connected_accounts;

-- Enable realtime for publish_jobs table (if it exists)
-- ALTER TABLE public.publish_jobs REPLICA IDENTITY FULL;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.publish_jobs;

-- Create table for publish jobs if not exists
CREATE TABLE IF NOT EXISTS public.publish_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  response JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for publish_jobs
ALTER TABLE public.publish_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for publish_jobs
CREATE POLICY "PublishJobs select own or admin" 
ON public.publish_jobs 
FOR SELECT 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "PublishJobs insert own or admin" 
ON public.publish_jobs 
FOR INSERT 
WITH CHECK ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "PublishJobs update own or admin" 
ON public.publish_jobs 
FOR UPDATE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "PublishJobs delete own or admin" 
ON public.publish_jobs 
FOR DELETE 
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for publish_jobs
ALTER TABLE public.publish_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.publish_jobs;

-- Add trigger for updated_at
CREATE TRIGGER update_publish_jobs_updated_at
  BEFORE UPDATE ON public.publish_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();