-- Enable realtime for content_queue table
ALTER TABLE public.content_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_queue;

-- Enable realtime for connected_accounts table  
ALTER TABLE public.connected_accounts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connected_accounts;