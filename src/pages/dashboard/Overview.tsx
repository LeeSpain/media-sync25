
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOverviewMetrics } from "@/hooks/useOverviewMetrics";
import { PersonalProfileSection } from "@/components/dashboard/PersonalProfileSection";

const Overview = () => {
  const { data, isLoading } = useOverviewMetrics();

  const leads = isLoading ? "…" : String(data?.leadsThisWeek ?? 0);
  const conv = isLoading ? "…" : `${(data?.conversionRate ?? 0).toFixed(1)}%`;
  const activeCamp = isLoading ? "…" : String(data?.activeCampaigns ?? 0);
  const engagement = isLoading ? "…" : String(data?.engagement7d ?? 0);

  return (
    <main>
      <SEO
        title="Media-Sync Dashboard Overview"
        description="Overview of leads, campaigns, and engagement with AI suggestions."
        canonical={window.location.href}
      />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Overview</h1>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Leads this week</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{leads}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Conversion rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{conv}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Active campaigns</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{activeCamp}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Engagement events (7d)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">{engagement}</p></CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <PersonalProfileSection />
        <Card>
          <CardHeader><CardTitle className="text-base">Welcome</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your dashboard reflects live data from your CRM, campaigns, and engagement. Create contacts, companies, and deals to get started.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Campaigns</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (data?.activeCampaigns ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No active campaigns yet.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                You have {data?.activeCampaigns} active campaign{(data?.activeCampaigns ?? 0) === 1 ? "" : "s"}.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Overview;
