
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

type Company = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

const CompaniesList = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName]       = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["crm_companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });

  const companies = useMemo(() => data ?? [], [data]);

  const onAdd = async () => {
    if (!name.trim()) {
      toast({ title: "Company name required" });
      return;
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      toast({ title: "Not signed in", description: "Please log in to add companies." });
      return;
    }
    const created_by = userData.user.id;
    const payload = {
      created_by,
      name: name.trim(),
      website: website || null,
      email: email || null,
      phone: phone || null,
      address: null as string | null,
    };
    const { error } = await supabase.from("crm_companies").insert([payload]);
    if (error) {
      console.error("Add company error:", error);
      toast({ title: "Error", description: error.message });
      return;
    }
    setName("");
    setWebsite("");
    setEmail("");
    setPhone("");
    toast({ title: "Company added" });
    qc.invalidateQueries({ queryKey: ["crm_companies"] });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick add company</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Input placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={onAdd}>Add company</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : companies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No companies yet. Create your first company above.</p>
          ) : (
            <ul className="divide-y">
              {companies.map((c) => (
                <li key={c.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.website || "—"} {c.email ? "• " + c.email : ""} {c.phone ? "• " + c.phone : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesList;
