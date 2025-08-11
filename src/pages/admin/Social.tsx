import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlatformSetting } from "@/hooks/usePlatformSetting";

const AdminSocial = () => {
  const { value, isLoading, save, saving } = usePlatformSetting<{ enabled: boolean }>(
    "module_social",
    { enabled: true }
  );
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main>
      <SEO title="Admin – Social Controls" description="Enable Social and manage connections & scheduler." canonical={canonical} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Social Controls</h1>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature flag</CardTitle>
            <CardDescription>Turn the Social module on or off for the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="social-enabled"
                checked={!!value.enabled}
                onCheckedChange={(checked) => save({ enabled: checked })}
                disabled={isLoading || saving}
              />
              <Label htmlFor="social-enabled">Enable Social</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>Manage provider connections and scopes.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use Admin Settings → Social connections to view linked accounts.
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminSocial;
