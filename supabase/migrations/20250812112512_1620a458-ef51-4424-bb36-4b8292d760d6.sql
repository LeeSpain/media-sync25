-- Enforce that only the specified email has the admin role
-- 1) Grant admin to the specified email if present
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'leewakeman@hotmail.co.uk'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Remove admin role from any other users
DELETE FROM public.user_roles ur
WHERE ur.role = 'admin'::app_role
  AND ur.user_id NOT IN (
    SELECT u.id FROM auth.users u WHERE lower(u.email) = 'leewakeman@hotmail.co.uk'
  );