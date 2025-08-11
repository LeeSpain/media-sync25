
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type Deal = {
  id: string;
  title: string;
  value: string | number;
  status: "open" | "won" | "lost";
  currency: string;
  created_at: string;
};

const DealsList = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle]   = useState("");
  const [value, setValue]   = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["crm_deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_deals")
        .select("id,title,value,status,currency,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Deal[];
    },
  });

  const deals = useMemo(() => data ?? [], [data]);

  const onAdd = async () => {
    if (!title.trim()) {
      toast({ title: "Deal title required" });
      return;
    }
    const num = parseFloat(value || "0");
    if (Number.isNaN(num)) {
      toast({ title: "Invalid value" });
      return;
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      toast({ title: "Not signed in", description: "Please log in to add deals." });
      return;
    }
    const payload = {
      created_by: userData.user.id,
      title: title.trim(),
      value: num,
      currency: "USD",
      status: "open" as const,
      contact_id: null as string | null,
      company_id: null as string | null,
      pipeline_id: null as string | null,
      stage_id: null as string | null,
    };
    const { error } = await supabase.from("crm_deals").insert([payload]);
    if (error) {
      console.error("Add deal error:", error);
      toast({ title: "Error", description: error.message });
      return;
    }
    setTitle("");
    setValue("");
    toast({ title: "Deal added" });
    qc.invalidateQueries({ queryKey: ["crm_deals"] });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick add deal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Value (e.g. 1000)" value={value} onChange={(e) => setValue(e.target.value)} />
            <Input placeholder="Currency" value="USD" disabled />
          </div>
          <div className="flex justify-end">
            <Button onClick={onAdd}>Add deal</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deals yet. Create your first deal above.</p>
          ) : (
            <ul className="divide-y">
              {deals.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{d.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {d.currency} {Number(d.value).toLocaleString()} • {d.status}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DealsList;
