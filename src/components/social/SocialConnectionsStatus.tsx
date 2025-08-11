import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertTriangle, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

type Connection = {
  id: string;
  provider: string;
  account_name: string | null;
  status: string;
  scopes: string[];
  created_at: string;
};

const providers = [
  { key: "twitter", name: "X / Twitter", Icon: Twitter, color: "text-sky-500" },
  { key: "linkedin", name: "LinkedIn", Icon: Linkedin, color: "text-blue-700" },
  { key: "facebook", name: "Facebook", Icon: Facebook, color: "text-blue-600" },
  { key: "instagram", name: "Instagram", Icon: Instagram, color: "text-pink-500" },
] as const;

export default function SocialConnectionsStatus() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("id, provider, account_name, status, scopes, created_at")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (error) {
        console.warn("Failed to load connections", error);
        setConnections([]);
      } else {
        setConnections(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const byProvider = useMemo(() => {
    const map: Record<string, Connection | undefined> = {};
    for (const p of providers) {
      map[p.key] = connections.find((c) => c.provider === p.key);
    }
    return map;
  }, [connections]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Social Accounts</CardTitle>
        <CardDescription>Manage accounts used for publishing.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map(({ key, name, Icon, color }) => {
            const conn = byProvider[key];
            const connected = !!conn && conn.status !== "disconnected";
            return (
              <div key={key} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`${color}`} />
                    <span className="font-medium">{name}</span>
                  </div>
                  {connected ? (
                    <CheckCircle2 className="text-green-600" />
                  ) : (
                    <AlertTriangle className="text-amber-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground min-h-10">
                  {loading ? "Loading..." : connected ? (
                    <>
                      <div className="text-foreground">{conn?.account_name ?? "Connected"}</div>
                      <div className="text-xs">Scopes: {(conn?.scopes || []).join(", ") || "N/A"}</div>
                    </>
                  ) : (
                    <>
                      <div>Not connected</div>
                    </>
                  )}
                </div>
                <div className="mt-4">
                  {connected ? (
                    <Button variant="secondary" asChild>
                      <Link to="/dashboard/settings#admin">Manage</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link to="/dashboard/settings#admin">Connect</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
