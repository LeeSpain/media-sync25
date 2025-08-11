import { useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const resetAllData = async () => {
    if (!confirm("This will permanently delete all your CRM and campaign data. Continue?")) return;
    setLoading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        toast({ title: "Not signed in", description: "Please log in to reset data." });
        setLoading(false);
        return;
      }
      const userId = userData.user.id;

      // 1) Fetch contacts (for contact_tags cleanup under RLS)
      const { data: contacts, error: contactsErr } = await supabase
        .from("crm_contacts")
        .select("id")
        .eq("created_by", userId);
      if (contactsErr) throw contactsErr;
      const contactIds = (contacts ?? []).map((c) => c.id);

      // 2) Delete dependent rows first
      if (contactIds.length > 0) {
        const { error: ctErr } = await supabase
          .from("crm_contact_tags")
          .delete()
          .in("contact_id", contactIds);
        if (ctErr) throw ctErr;
      }

      // Order matters: events -> activities -> deals -> contacts/companies -> tags -> stages -> pipelines -> campaigns
      {
        const { error } = await supabase.from("engagement_events").delete().eq("created_by", userId);
        if (error) throw new Error(`engagement_events: ${error.message}`);
      }
      {
        const { error } = await supabase.from("crm_activities").delete().eq("created_by", userId);
        if (error) throw new Error(`crm_activities: ${error.message}`);
      }
      {
        const { error } = await supabase.from("crm_deals").delete().eq("created_by", userId);
        if (error) throw new Error(`crm_deals: ${error.message}`);
      }
      {
        const { error } = await supabase.from("crm_contacts").delete().eq("created_by", userId);
        if (error) throw new Error(`crm_contacts: ${error.message}`);
      }
      {
        const { error } = await supabase.from("crm_companies").delete().eq("created_by", userId);
        if (error) throw new Error(`crm_companies: ${error.message}`);
      }
      {
        const { error } = await supabase.from("crm_tags").delete().eq("created_by", userId);
        if (error) throw new Error(`crm_tags: ${error.message}`);
      }
      {
        const { error } = await supabase.from("crm_stages").delete().eq("created_by", userId);
        if (error) throw new Error(`crm_stages: ${error.message}`);
      }
      {
        const { error } = await supabase.from("crm_pipelines").delete().eq("created_by", userId);
        if (error) throw new Error(`crm_pipelines: ${error.message}`);
      }
      {
        const { error } = await supabase.from("campaigns").delete().eq("created_by", userId);
        if (error) throw new Error(`campaigns: ${error.message}`);
      }

      toast({ title: "Data reset complete", description: "All your demo/data records have been removed." });
    } catch (e: any) {
      console.error("Reset data error:", e);
      toast({ title: "Error resetting data", description: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <SEO title="Media-Sync Settings" description="Manage account and workspace preferences." canonical={window.location.href} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Settings</h1>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Danger zone</CardTitle>
            <CardDescription>Remove all demo/workspace data you own across CRM and campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This action permanently deletes your contacts, companies, deals, activities, tags, pipelines, stages, campaigns, and
              engagement events. It cannot be undone.
            </p>
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="destructive" onClick={resetAllData} disabled={loading} aria-label="Reset all data">
              {loading ? "Deleting…" : "Reset all data"}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
};

export default Settings;

