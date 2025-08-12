import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import CreateCampaignDialog, { Campaign } from "@/components/planner/CreateCampaignDialog";
import { toast } from "@/hooks/use-toast";

const Planner = () => {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [range, setRange] = useState<string>("week");
  const [openCreate, setOpenCreate] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("campaigns")
          .select("id,name,description,status,start_at,end_at,created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (isMounted) setCampaigns((data ?? []) as Campaign[]);
      } catch (err: any) {
        console.error(err);
        toast({ title: "Failed to load campaigns", description: err.message ?? "Unexpected error" });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const withinRange = (iso?: string | null) => {
    if (!iso) return true;
    const date = new Date(iso);
    const now = new Date();
    if (range === "week") {
      const weekAhead = new Date();
      weekAhead.setDate(now.getDate() + 7);
      return date <= weekAhead;
    }
    if (range === "month") {
      const monthAhead = new Date();
      monthAhead.setMonth(now.getMonth() + 1);
      return date <= monthAhead;
    }
    if (range === "quarter") {
      const qAhead = new Date();
      qAhead.setMonth(now.getMonth() + 3);
      return date <= qAhead;
    }
    return true;
  };

  const filtered = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          (status === "all" || c.status === status) &&
          (!q || c.name.toLowerCase().includes(q.toLowerCase())) &&
          withinRange(c.start_at)
      ),
    [campaigns, q, status, range]
  );

  const handleCreated = (c: Campaign) => {
    setCampaigns((prev) => [c, ...prev]);
  };

  return (
    <main className="container py-6 space-y-6">
      <SEO title="Campaign Planner" description="Plan and schedule multi-channel campaigns across social, email, and SMS." canonical={window.location.href} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaign Planner</h1>
          <p className="text-muted-foreground">Plan, schedule, and track campaigns across channels.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/calendar"><Button variant="outline">Calendar</Button></Link>
          <Button variant="secondary" onClick={() => toast({ title: "Import coming soon" })}>Import Schedule</Button>
          <Button onClick={() => setOpenCreate(true)}>Create Campaign</Button>
        </div>
      </header>

      <section aria-label="Filters" className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1">
          <label htmlFor="search" className="text-sm text-muted-foreground">Search</label>
          <Input id="search" placeholder="Find campaigns" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-muted-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <label className="text-sm text-muted-foreground">Timeframe</label>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger><SelectValue placeholder="This week" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {loading ? (
        <Card>
          <CardHeader><CardTitle>Loading campaigns…</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-sm">Please wait</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Plan your first campaign"
          description="Create a campaign or import a schedule. You can also set up your CRM first for better targeting."
          actions={[
            { label: "Create Campaign", to: "/dashboard/content", variant: "default" },
            { label: "Open CRM", to: "/dashboard/crm", variant: "secondary" },
            { label: "View Settings", to: "/dashboard/settings", variant: "outline" },
          ]}
        />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Schedule overview ({range})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                  <div key={d} className="rounded-md border bg-card p-2">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">{d}</div>
                    <div className="space-y-2">
                      {/* events will render here */}
                      <div className="text-xs text-muted-foreground">No items</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {filtered.map((c) => (
                  <li key={c.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.start_at ? new Date(c.start_at).toLocaleString() : "No start date"}
                      {c.end_at ? ` – ${new Date(c.end_at).toLocaleString()}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <CreateCampaignDialog open={openCreate} onOpenChange={setOpenCreate} onCreated={handleCreated} />
    </main>
  );
};

export default Planner;
