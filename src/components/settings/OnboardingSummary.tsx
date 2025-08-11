import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function OnboardingSummary() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("onboarding")
          .select("data")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        setRow(data?.data || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Onboarding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !row ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">No onboarding data yet.</p>
            <a href="/onboarding"><Button size="sm">Start</Button></a>
          </div>
        ) : (
          <>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">Owner</dt><dd className="font-medium">{[row.personalFirstName, row.personalLastName].filter(Boolean).join(" ") || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Owner Email</dt><dd className="font-medium">{row.personalEmail || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Business</dt><dd className="font-medium">{row.name || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Industry</dt><dd className="font-medium">{row.industry || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Website</dt><dd className="font-medium">{row.website || "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Primary goal</dt><dd className="font-medium">{row.goal || "—"}</dd></div>
            </dl>
            <div className="pt-2">
              <a href="/onboarding"><Button variant="secondary" size="sm">Edit</Button></a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
