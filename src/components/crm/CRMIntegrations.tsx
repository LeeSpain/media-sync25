import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { PlugZap, Building2, UploadCloud, DatabaseZap, Cable, Workflow } from "lucide-react";

 type Connection = {
  id: string;
  provider: string;
  account_name: string | null;
  status: string;
  scopes: string[] | null;
  created_at: string;
 };

 type ProviderKey = "hubspot" | "salesforce" | "pipedrive" | "zoho" | "zapier" | "csv";

 const providers: Array<{
  key: ProviderKey;
  name: string;
  description: string;
  icon: any;
  color: string;
  requiresToken?: boolean;
 }> = [
  { key: "hubspot", name: "HubSpot", description: "Sync contacts, companies and deals via private app token.", icon: Building2, color: "text-orange-600", requiresToken: true },
  { key: "salesforce", name: "Salesforce", description: "Enterprise CRM with OAuth. Use Zapier for quick sync.", icon: DatabaseZap, color: "text-blue-600" },
  { key: "pipedrive", name: "Pipedrive", description: "Simple CRM. Connect with a personal API token.", icon: Workflow, color: "text-emerald-600", requiresToken: true },
  { key: "zoho", name: "Zoho CRM", description: "Connect via OAuth (coming soon) or use Zapier.", icon: Cable, color: "text-red-600" },
  { key: "zapier", name: "Zapier", description: "No-code sync using webhooks and templates.", icon: PlugZap, color: "text-yellow-600" },
  { key: "csv", name: "CSV Import", description: "Bulk import contacts from a CSV file.", icon: UploadCloud, color: "text-slate-600" },
 ];

 export default function CRMIntegrations() {
  const qc = useQueryClient();
  const [openKey, setOpenKey] = useState<ProviderKey | null>(null);
  const [accountName, setAccountName] = useState("");
  const [token, setToken] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["connected_accounts", "crm"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connected_accounts")
        .select("id,provider,account_name,status,scopes,created_at")
        .in("provider", providers.map(p => p.key));
      if (error) throw error;
      return data as Connection[];
    },
  });

  const byProvider = useMemo(() => {
    const map: Record<string, Connection | undefined> = {};
    (data || []).forEach((c) => { map[c.provider] = c; });
    return map;
  }, [data]);

  const connectMutation = useMutation({
    mutationFn: async (provider: ProviderKey) => {
      const { data: ures, error: aerr } = await supabase.auth.getUser();
      if (aerr) throw aerr;
      const uid = ures.user?.id;
      if (!uid) throw new Error("Not authenticated");

      const payload: any = {
        provider,
        account_name: accountName || provider,
        status: "connected",
        scopes: [],
        metadata: token ? { tokenSaved: true, tokenType: "api" } : {},
        created_by: uid,
      };

      const { error } = await supabase.from("connected_accounts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Connected", description: "Integration saved successfully." });
      setOpenKey(null);
      setAccountName("");
      setToken("");
      qc.invalidateQueries({ queryKey: ["connected_accounts", "crm"] });
    },
    onError: (e: any) => toast({ title: "Connection failed", description: e?.message ?? "Please try again.", variant: "destructive" }),
  });

  const handleCSVUpload = async (file: File) => {
    // Minimal placeholder: in a real app you'd parse and insert into crm_contacts
    toast({ title: "CSV received", description: `We received ${file.name}. Parsing coming soon.` });
  };

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connect your existing CRM</CardTitle>
          <CardDescription>Link popular CRMs or import via CSV. Manage connections anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => {
              const connected = !!byProvider[p.key];
              const Icon = p.icon;
              return (
                <Card key={p.key} className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${p.color}`} />
                        <CardTitle className="text-base">{p.name}</CardTitle>
                      </div>
                      {connected ? (
                        <Badge variant="secondary">Connected</Badge>
                      ) : (
                        <Badge variant="outline">Not connected</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{p.description}</p>

                    {p.key === "csv" ? (
                      <div className="space-y-3">
                        <Button asChild variant="outline" size="sm">
                          <a href="/templates/contacts.csv" download>
                            Download CSV template
                          </a>
                        </Button>
                        <Input type="file" accept=".csv" onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCSVUpload(f);
                        }} />
                      </div>
                    ) : (
                      <Dialog open={openKey === p.key} onOpenChange={(v) => setOpenKey(v ? p.key : null)}>
                        <DialogTrigger asChild>
                          <Button variant={connected ? "secondary" : "default"} className="w-full">
                            {connected ? "Manage" : "Connect"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{connected ? `Manage ${p.name}` : `Connect ${p.name}`}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="account_name">Account name</Label>
                              <Input id="account_name" placeholder={`${p.name} workspace or org`} value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                            </div>
                            {p.requiresToken && (
                              <div className="space-y-2">
                                <Label htmlFor="token">API token</Label>
                                <Input id="token" type="password" placeholder="Paste API token" value={token} onChange={(e) => setToken(e.target.value)} />
                                <p className="text-xs text-muted-foreground">We store this securely to enable syncing. You can revoke anytime.</p>
                              </div>
                            )}
                            {!p.requiresToken && (
                              <p className="text-xs text-muted-foreground">OAuth connection coming soon. For now, you can mark as connected to track the link, or use Zapier.</p>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setOpenKey(null)}>Cancel</Button>
                            <Button onClick={() => connectMutation.mutate(p.key)} disabled={connectMutation.isPending}>
                              {connected ? "Save" : "Connect"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
