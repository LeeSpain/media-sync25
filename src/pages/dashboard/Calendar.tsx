import { useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as DayPicker } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";

interface Campaign { id: string; name: string; status: string; start_at: string | null }

export default function CalendarPage() {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [rows, setRows] = useState<Campaign[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name, status, start_at")
        .order("start_at", { ascending: true });
      if (!error && data) setRows(data as any);
    })();
  }, []);

  const byDay = useMemo(() => {
    const map: Record<string, Campaign[]> = {};
    for (const c of rows) {
      if (!c.start_at) continue;
      const d = new Date(c.start_at);
      const key = d.toISOString().slice(0, 10);
      map[key] = map[key] || [];
      map[key].push(c);
    }
    return map;
  }, [rows]);

  const dayKey = selected ? selected.toISOString().slice(0, 10) : undefined;
  const dayItems = (dayKey && byDay[dayKey]) || [];

  return (
    <main className="container py-6 space-y-6">
      <SEO title="Calendar" description="Month calendar of your campaigns and activities." canonical={window.location.href} />
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">Plan across projects and dashboards.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Month view</CardTitle>
          </CardHeader>
          <CardContent>
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
              numberOfMonths={1}
              className="p-3 pointer-events-auto"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected ? selected.toDateString() : "Selected day"}</CardTitle>
          </CardHeader>
          <CardContent>
            {dayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {dayItems.map((c) => (
                  <li key={c.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Campaign</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
