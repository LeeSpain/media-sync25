import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const Overview = () => {
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
          <CardContent><p className="text-2xl font-semibold">24</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Conversion rate</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">3.2%</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Active campaigns</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">5</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Social engagement</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-semibold">+18%</p></CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Welcome</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You gained 24 new leads this week and engagement is up 18% compared to last week.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Active Campaigns</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {["Spring Sale", "Referral Boost", "IG Growth"].map((c, i) => (
              <div key={c}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{c}</span>
                  <span className="text-muted-foreground">{(40 + i * 20)}%</span>
                </div>
                <Progress value={40 + i * 20} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Overview;
