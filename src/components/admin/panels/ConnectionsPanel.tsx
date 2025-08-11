
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Connection = {
  id: string;
  provider: string;
  account_name: string | null;
  status: string;
  scopes: string[] | null;
  created_at: string;
};

export default function ConnectionsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["connected_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("id,provider,account_name,status,scopes,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Connection[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : !data?.length ? (
          <div className="text-muted-foreground">No connections yet.</div>
        ) : (
          <div className="grid gap-2">
            {data.map((c) => (
              <div key={c.id} className="flex items-center justify-between border rounded-md p-3">
                <div className="text-sm">
                  <div className="font-medium">{c.account_name || "(unnamed)"}</div>
                  <div className="text-muted-foreground">{c.provider}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{c.status}</Badge>
                  {c.scopes?.length ? (
                    <div className="hidden md:block text-xs text-muted-foreground">
                      {c.scopes.slice(0, 3).join(", ")}
                      {c.scopes.length > 3 ? "…" : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
