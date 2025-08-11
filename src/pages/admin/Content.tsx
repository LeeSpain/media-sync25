import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlatformSetting } from "@/hooks/usePlatformSetting";

const AdminContent = () => {
  const { value, isLoading, save, saving } = usePlatformSetting<{ enabled: boolean }>(
    "module_content",
    { enabled: true }
  );
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main>
      <SEO title="Admin – Content Controls" description="Enable Content and configure creation defaults." canonical={canonical} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Content Controls</h1>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature flag</CardTitle>
            <CardDescription>Turn the Content module on or off for the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="content-enabled"
                checked={!!value.enabled}
                onCheckedChange={(checked) => save({ enabled: checked })}
                disabled={isLoading || saving}
              />
              <Label htmlFor="content-enabled">Enable Content</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>Allowed kinds/channels and AI defaults.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming soon: define allowed content kinds and default AI model.
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminContent;
