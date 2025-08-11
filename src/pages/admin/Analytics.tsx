import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlatformSetting } from "@/hooks/usePlatformSetting";

const AdminAnalytics = () => {
  const { value, isLoading, save, saving } = usePlatformSetting<{ enabled: boolean }>(
    "module_analytics",
    { enabled: true }
  );
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main>
      <SEO title="Admin – Analytics Controls" description="Enable Analytics and configure data sources." canonical={canonical} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Analytics Controls</h1>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature flag</CardTitle>
            <CardDescription>Turn the Analytics & Reports module on or off for the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="analytics-enabled"
                checked={!!value.enabled}
                onCheckedChange={(checked) => save({ enabled: checked })}
                disabled={isLoading || saving}
              />
              <Label htmlFor="analytics-enabled">Enable Analytics</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data sources</CardTitle>
            <CardDescription>Configure GA4 properties and retention.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming soon: GA4 property ID, sampling and retention settings.
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminAnalytics;
