
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PublishJobsList from "@/components/social/PublishJobsList";
import RecentClients from "./RecentClients";
import AdminQuickLinks from "./AdminQuickLinks";
import { useAdminOverviewStats } from "@/hooks/useAdminOverviewStats";
import { CheckCircle2, AlertTriangle, Database, Rocket } from "lucide-react";

export default function AdminOverview() {
  const { data: stats, isLoading } = useAdminOverviewStats();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <AdminQuickLinks />

      <Card>
        <CardHeader>
          <CardTitle>Snapshot</CardTitle>
          <CardDescription>Key metrics across your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[ 
              { label: "Members", value: stats?.members ?? 0 },
              { label: "Companies", value: stats?.companies ?? 0 },
              { label: "Contacts", value: stats?.contacts ?? 0 },
              { label: "Open deals", value: stats?.openDeals ?? 0 },
              { label: "Active campaigns", value: stats?.activeCampaigns ?? 0 },
            ].map((m) => (
              <div key={m.label} className="rounded-md border p-4">
                <div className="text-2xl font-semibold tabular-nums">
                  {isLoading ? "—" : m.value}
                </div>
                <div className="text-sm text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PublishJobsList />
        <div className="space-y-6">
          <RecentClients />
          <Card>
            <CardHeader>
              <CardTitle>System health</CardTitle>
              <CardDescription>High-level status for core systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Database</div>
                    <div className="text-xs text-muted-foreground">RLS and tables configured</div>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Healthy
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Edge functions</div>
                    <div className="text-xs text-muted-foreground">Scheduling and publishing</div>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div>
                    <div className="font-medium">Twitter credentials</div>
                    <div className="text-xs text-muted-foreground">Add keys to enable publishing</div>
                  </div>
                </div>
                <Badge variant="outline">Action needed</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
