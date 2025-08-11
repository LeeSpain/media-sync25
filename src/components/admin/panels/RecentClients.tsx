import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function RecentClients() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_companies")
        .select("id, name, website, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Clients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !data || data.length === 0 ? (
          <div className="text-sm text-muted-foreground">No clients yet.</div>
        ) : (
          <ul className="space-y-2">
            {data.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.website || "—"}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(c.created_at as any).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
