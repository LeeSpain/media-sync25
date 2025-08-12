import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/components/ui/use-toast";

interface JobRow {
  id: string;
  provider: string | null;
  status: string;
  error: string | null;
  created_at: string;
  response: any;
}

export default function PublishJobsList() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const title = useMemo(() => "Recent publish jobs", []);

  const load = async () => {
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("publish_jobs")
      .select("id, provider, status, error, created_at, response")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.warn("Failed to load jobs", error);
      setJobs([]);
    } else {
      setJobs(data as JobRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("publish-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "publish_jobs", filter: `created_by=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const runScheduler = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      setRunning(true);
      const { data, error } = await supabase.functions.invoke("run-scheduler");
      if (error) throw error as any;
      toast({ title: "Scheduler finished", description: `${data?.processed ?? 0} processed, ${data?.successes ?? 0} ok, ${data?.failures ?? 0} failed` });
      load();
    } catch (e: any) {
      toast({ title: "Scheduler error", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Shows the last 20 publish attempts and their status.</CardDescription>
        </div>
        <Button onClick={runScheduler} disabled={running}>
          {running ? "Running..." : "Run Scheduler now"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs yet.</p>
        ) : (
          <ul className="space-y-3">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-start justify-between border rounded-md p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{j.provider ?? "unknown"}</Badge>
                    <Badge variant={j.status === "completed" ? "default" : j.status === "failed" ? "destructive" : "secondary"}>
                      {j.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(j.created_at).toLocaleString()}
                  </div>
                  {j.error && <div className="text-xs text-destructive">{j.error}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
