-- Add more fields to contacts table
ALTER TABLE public.crm_contacts 
ADD COLUMN date_of_birth date,
ADD COLUMN mobile_phone text,
ADD COLUMN work_phone text,
ADD COLUMN personal_email text,
ADD COLUMN work_email text,
ADD COLUMN address text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN postal_code text,
ADD COLUMN country text;

-- Add more fields to companies table  
ALTER TABLE public.crm_companies
ADD COLUMN industry text,
ADD COLUMN employee_count integer,
ADD COLUMN annual_revenue numeric,
ADD COLUMN description text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN postal_code text,
ADD COLUMN country text;

-- Create links table for social media and other links
CREATE TABLE public.crm_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  link_type text NOT NULL, -- 'linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'website', 'email', 'phone', 'other'
  label text, -- custom label like "Personal LinkedIn" or "Work Phone"
  url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT link_belongs_to_contact_or_company CHECK (
    (contact_id IS NOT NULL AND company_id IS NULL) OR 
    (contact_id IS NULL AND company_id IS NOT NULL)
  )
);

-- Enable RLS on links table
ALTER TABLE public.crm_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for links
CREATE POLICY "Links select own or admin" 
ON public.crm_links 
FOR SELECT 
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Links insert own or admin" 
ON public.crm_links 
FOR INSERT 
WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Links update own or admin" 
ON public.crm_links 
FOR UPDATE 
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Links delete own or admin" 
ON public.crm_links 
FOR DELETE 
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_links_updated_at
BEFORE UPDATE ON public.crm_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_crm_links_contact_id ON public.crm_links(contact_id);
CREATE INDEX idx_crm_links_company_id ON public.crm_links(company_id);
CREATE INDEX idx_crm_links_type ON public.crm_links(link_type);