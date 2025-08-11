
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, subDays } from "date-fns";

type Metrics = {
  leadsThisWeek: number;
  conversionRate: number; // 0..100
  activeCampaigns: number;
  engagement7d: number;
};

export const useOverviewMetrics = () => {
  return useQuery({
    queryKey: ["overview-metrics"],
    queryFn: async (): Promise<Metrics> => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
      const sevenDaysAgo = subDays(now, 7);
      const prevSevenDaysStart = subDays(sevenDaysAgo, 7);

      // Leads this week
      const { count: leadsCount, error: leadsErr } = await supabase
        .from("crm_contacts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString());
      if (leadsErr) throw leadsErr;

      // Conversion rate: won/total deals
      const [{ count: totalDeals, error: totalErr }, { count: wonDeals, error: wonErr }] = await Promise.all([
        supabase.from("crm_deals").select("*", { count: "exact", head: true }),
        supabase.from("crm_deals").select("*", { count: "exact", head: true }).eq("status", "won"),
      ]);
      if (totalErr) throw totalErr;
      if (wonErr) throw wonErr;
      const conversionRate = totalDeals && totalDeals > 0 ? (100 * (wonDeals || 0)) / totalDeals : 0;

      // Active campaigns
      const { count: activeCamp, error: activeErr } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (activeErr) throw activeErr;

      // Engagement events last 7 days
      const { count: engagement7d, error: engErr } = await supabase
        .from("engagement_events")
        .select("*", { count: "exact", head: true })
        .gte("occurred_at", sevenDaysAgo.toISOString());
      if (engErr) throw engErr;

      return {
        leadsThisWeek: leadsCount || 0,
        conversionRate: conversionRate,
        activeCampaigns: activeCamp || 0,
        engagement7d: engagement7d || 0,
      };
    },
  });
};
