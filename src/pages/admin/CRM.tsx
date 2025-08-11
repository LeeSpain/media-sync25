import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlatformSetting } from "@/hooks/usePlatformSetting";

const AdminCRM = () => {
  const { value, isLoading, save, saving } = usePlatformSetting<{ enabled: boolean }>(
    "module_crm",
    { enabled: true }
  );
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main>
      <SEO title="Admin – CRM Controls" description="Enable CRM and manage high-level CRM options." canonical={canonical} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">CRM Controls</h1>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature flag</CardTitle>
            <CardDescription>Turn the CRM module on or off for the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="crm-enabled"
                checked={!!value.enabled}
                onCheckedChange={(checked) => save({ enabled: checked })}
                disabled={isLoading || saving}
              />
              <Label htmlFor="crm-enabled">Enable CRM</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline & tags</CardTitle>
            <CardDescription>Manage pipelines, stages, and contact tags.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming soon: configure default pipeline, stages ordering, and global tags.
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminCRM;
