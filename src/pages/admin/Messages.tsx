import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlatformSetting } from "@/hooks/usePlatformSetting";

const AdminMessages = () => {
  const { value, isLoading, save, saving } = usePlatformSetting<{ enabled: boolean }>(
    "module_messages",
    { enabled: true }
  );
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main>
      <SEO title="Admin – Messages Controls" description="Enable Messages and configure provider defaults." canonical={canonical} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Messages Controls</h1>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature flag</CardTitle>
            <CardDescription>Turn the WhatsApp & SMS module on or off for the workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="messages-enabled"
                checked={!!value.enabled}
                onCheckedChange={(checked) => save({ enabled: checked })}
                disabled={isLoading || saving}
              />
              <Label htmlFor="messages-enabled">Enable Messages</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider</CardTitle>
            <CardDescription>Twilio or other SMS/WhatsApp providers via Supabase secrets.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Coming soon: provider selection, number status and rate limits.
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminMessages;
