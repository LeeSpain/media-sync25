-- Add sample CRM data for testing
INSERT INTO public.crm_companies (name, website, email, phone, industry, description, employee_count, annual_revenue, address, city, state, postal_code, country, created_by) VALUES
(
  'Acme Corp',
  'https://acme-corp.example.com',
  'contact@acme-corp.example.com',
  '+1-555-0123',
  'Manufacturing',
  'Leading manufacturer of industrial equipment and automation solutions',
  150,
  25000000,
  '123 Industrial Blvd',
  'Detroit',
  'MI',
  '48201',
  'USA',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
),
(
  'Digital Dynamics',
  'https://digitaldynamics.example.com',
  'hello@digitaldynamics.example.com',
  '+1-555-0456',
  'Technology',
  'Software development and digital transformation consultancy',
  45,
  8500000,
  '456 Tech Center Dr',
  'Austin',
  'TX',
  '78701',
  'USA',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
);

-- Add sample contacts
INSERT INTO public.crm_contacts (first_name, last_name, email, phone, job_title, company_id, notes, created_by) VALUES
(
  'Sarah',
  'Johnson',
  'sarah.johnson@acme-corp.example.com',
  '+1-555-0123',
  'VP of Operations',
  (SELECT id FROM crm_companies WHERE name = 'Acme Corp' LIMIT 1),
  'Key decision maker for automation projects. Interested in efficiency improvements.',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
),
(
  'Mike',
  'Chen',
  'mike.chen@digitaldynamics.example.com',
  '+1-555-0456',
  'CTO',
  (SELECT id FROM crm_companies WHERE name = 'Digital Dynamics' LIMIT 1),
  'Technical lead evaluating new development tools and platforms.',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
),
(
  'Emily',
  'Rodriguez',
  'emily.rodriguez@techstart.example.com',
  '+1-555-0789',
  'Head of Marketing',
  NULL,
  'Independent marketing consultant looking for productivity tools for her team.',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
);

-- Add sample deals
INSERT INTO public.crm_deals (title, value, currency, status, contact_id, company_id, expected_close_date, created_by) VALUES
(
  'Automation Platform Implementation',
  125000.00,
  'USD',
  'open',
  (SELECT id FROM crm_contacts WHERE email = 'sarah.johnson@acme-corp.example.com' LIMIT 1),
  (SELECT id FROM crm_companies WHERE name = 'Acme Corp' LIMIT 1),
  '2025-03-15',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
),
(
  'Development Tools License',
  45000.00,
  'USD',
  'open',
  (SELECT id FROM crm_contacts WHERE email = 'mike.chen@digitaldynamics.example.com' LIMIT 1),
  (SELECT id FROM crm_companies WHERE name = 'Digital Dynamics' LIMIT 1),
  '2025-02-28',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
);

-- Add sample content queue items
INSERT INTO public.content_queue (content_type, title, content, platforms, status, business_id, scheduled_for, created_by) VALUES
(
  'social_post',
  'Tips for Remote Team Productivity',
  'Here are 5 proven strategies that helped our clients increase remote team productivity by 40%:\n\n1. Set clear daily check-ins\n2. Use collaborative tools effectively\n3. Define work-from-home boundaries\n4. Celebrate small wins\n5. Invest in the right technology\n\nWhat''s your top productivity tip? 💡\n\n#RemoteWork #Productivity #TeamManagement',
  ARRAY['twitter', 'linkedin'],
  'pending',
  (SELECT id FROM businesses WHERE name = 'TechStart Solutions' LIMIT 1),
  '2025-01-25 10:00:00+00',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
),
(
  'blog_post',
  'The Future of Sustainable Energy in Business',
  'As businesses worldwide commit to carbon neutrality, sustainable energy solutions are becoming essential...',
  ARRAY['website', 'linkedin'],
  'approved',
  (SELECT id FROM businesses WHERE name = 'Green Energy Consulting' LIMIT 1),
  '2025-01-26 14:00:00+00',
  (SELECT id FROM auth.users WHERE email = 'leewakeman@hotmail.co.uk' LIMIT 1)
);