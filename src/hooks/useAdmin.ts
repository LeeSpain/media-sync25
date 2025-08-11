import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_EMAIL_ALLOWLIST = [
  "leewkamen@hotmail.co.uk",
];

export function useAdmin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        } as any);
        if (error) {
          console.error('has_role error', error);
        }
        const email = (user.email || "").toLowerCase();
        const allowlisted = ADMIN_EMAIL_ALLOWLIST.includes(email);
        if (mounted) {
          setIsAdmin(Boolean(data) || allowlisted);
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, isAdmin };
}
