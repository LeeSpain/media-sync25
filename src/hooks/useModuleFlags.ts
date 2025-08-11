import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ModuleFlags = {
  [key: string]: { enabled: boolean };
};

const defaultFlags: ModuleFlags = {
  module_crm: { enabled: true },
  module_planner: { enabled: true },
  module_content: { enabled: true },
  module_social: { enabled: true },
  module_email: { enabled: true },
  module_messages: { enabled: true },
  module_analytics: { enabled: true },
  module_social_twitter: { enabled: true },
  module_social_linkedin: { enabled: true },
  module_social_meta: { enabled: true },
  module_social_scheduler: { enabled: true },
};

export function useModuleFlags() {
  const query = useQuery({
    queryKey: ["module_flags"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-module-flags", {
        body: {},
      });
      if (error) throw error;
      const flags = (data?.flags as ModuleFlags) ?? defaultFlags;
      return { ...defaultFlags, ...flags } as ModuleFlags;
    },
  });

  return {
    flags: (query.data ?? defaultFlags) as ModuleFlags,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
