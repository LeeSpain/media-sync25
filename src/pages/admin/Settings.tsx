import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ConnectionsPanel from "@/components/admin/panels/ConnectionsPanel";
import APIKeysPanel from "@/components/admin/panels/APIKeysPanel";

const AdminSettingsPage = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;

  return (
    <main>
      <SEO
        title="Admin Settings – Platform"
        description="Manage platform settings and social connections for your workspace."
        canonical={canonical}
      />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Admin settings</h1>

      <section className="space-y-6">
        <article>
          <Card>
            <CardHeader>
              <CardTitle>Social connections</CardTitle>
              <CardDescription>View the accounts linked to this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionsPanel />
            </CardContent>
          </Card>
        </article>

        <article>
          <Card>
            <CardHeader>
              <CardTitle>API Keys Management</CardTitle>
              <CardDescription>
                Securely configure API keys for platform integrations and services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <APIKeysPanel />
            </CardContent>
          </Card>
        </article>

        <article>
          <Card>
            <CardHeader>
              <CardTitle>Provider setup</CardTitle>
              <CardDescription>
                OAuth credentials are stored securely in Supabase. Use the chat to add provider secrets and we’ll enable the connect flows.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Supported providers roadmap: X/Twitter (ready), LinkedIn, Facebook Pages, Instagram Business.
            </CardContent>
          </Card>
        </article>
      </section>
    </main>
  );
};

export default AdminSettingsPage;
