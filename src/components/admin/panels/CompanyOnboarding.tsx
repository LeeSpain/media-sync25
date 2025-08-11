
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

type Company = {
  id: string;
  name: string | null;
  website: string | null;
};

export default function CompanyOnboarding() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_companies")
        .select("id,name,website")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });

  const createCompany = useMutation({
    mutationFn: async (payload: { name: string; website: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("crm_companies")
        .insert([{ name: payload.name, website: payload.website, created_by: user.id }])
        .select("id")
        .single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies"] });
      toast({ title: "Company created", description: "You can now start research." });
    },
    meta: { onError: true },
  });

  const startResearch = useMutation({
    mutationFn: async (payload: { company_id: string; source_url: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("company_research").insert([
        {
          company_id: payload.company_id,
          source_url: payload.source_url,
          created_by: user.id,
          status: "pending",
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Research queued", description: "Status set to pending." });
      qc.invalidateQueries({ queryKey: ["company_research"] });
    },
    meta: { onError: true },
  });

  const { data: research, isLoading: researchLoading } = useQuery({
    queryKey: ["company_research"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_research")
        .select("id, created_at, status, source_url, company_id")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Array<{
        id: string;
        created_at: string;
        status: string;
        source_url: string | null;
        company_id: string;
      }>;
    },
  });

  const selectedCompany = useMemo(
    () => companies?.find((c) => c.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  );

  const onCreateCompany = () => {
    if (!name || !url) {
      toast({ title: "Missing info", description: "Please enter company name and URL." });
      return;
    }
    createCompany.mutate({ name, website: url });
  };

  const onQueueResearch = () => {
    const cid = selectedCompanyId || selectedCompany?.id;
    if (!cid || !url) {
      toast({ title: "Missing info", description: "Select a company and provide a URL." });
      return;
    }
    startResearch.mutate({ company_id: cid, source_url: url });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Onboarding & Research</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label htmlFor="companyName">Company name</Label>
            <Input id="companyName" placeholder="Acme Inc." value={name} onChange={(e) => setName(e.target.value)} />
            <Label htmlFor="companyUrl">Company URL</Label>
            <Input id="companyUrl" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
            <Button className="w-full" onClick={onCreateCompany} disabled={createCompany.isPending || !user}>
              {createCompany.isPending ? "Creating..." : "Create Company"}
            </Button>
          </div>

          <div className="space-y-3">
            <Label>Use existing company</Label>
            <Select
              value={selectedCompanyId ?? ""}
              onValueChange={(v) => setSelectedCompanyId(v)}
              disabled={companiesLoading || !companies?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder={companiesLoading ? "Loading..." : "Select company"} />
              </SelectTrigger>
              <SelectContent>
                {(companies ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.website || c.id.slice(0, 6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              className="w-full"
              onClick={onQueueResearch}
              disabled={startResearch.isPending || !user || (!selectedCompanyId && !selectedCompany)}
            >
              {startResearch.isPending ? "Queuing..." : "Start Research"}
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <Label>Recent research</Label>
          <div className="mt-2 grid gap-2">
            {researchLoading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : (research?.length ?? 0) === 0 ? (
              <div className="text-muted-foreground">No research yet.</div>
            ) : (
              research!.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="text-sm">
                    <div className="font-medium">{r.source_url || "No URL"}</div>
                    <div className="text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded bg-muted">{r.status}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
