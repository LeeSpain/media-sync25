import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminStats = {
  members: number;
  companies: number;
  contacts: number;
  openDeals: number;
  activeCampaigns: number;
};

export const useAdminOverviewStats = () => {
  return useQuery<AdminStats>({
    queryKey: ["admin-overview-stats"],
    queryFn: async () => {
      const [profilesRes, companiesRes, contactsRes, dealsRes, campaignsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("crm_companies").select("*", { count: "exact", head: true }),
        supabase.from("crm_contacts").select("*", { count: "exact", head: true }),
        supabase.from("crm_deals").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("campaigns").select("*", { count: "exact", head: true }).neq("status", "draft"),
      ]);

      const getCount = (res: any) => (res.count as number | null) ?? 0;

      return {
        members: getCount(profilesRes),
        companies: getCount(companiesRes),
        contacts: getCount(contactsRes),
        openDeals: getCount(dealsRes),
        activeCampaigns: getCount(campaignsRes),
      };
    },
  });
};
