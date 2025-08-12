import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * BusinessOnboardingModal
 * - Auto-opens on dashboard load if onboarding is incomplete
 * - Collects brand, audience, goals, social links
 * - Saves to `onboarding` table as JSON
 * - Triggers `company-research` edge function using the latest company website
 */
export const BusinessOnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [brandTone, setBrandTone] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const sessionDismissed = useMemo(() => sessionStorage.getItem("onboarding_modal_dismissed") === "1", []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth.user;
        if (!user) {
          setLoading(false);
          return;
        }

        // Prefill from existing onboarding data if present
        const { data: row } = await supabase
          .from("onboarding")
          .select("data")
          .eq("user_id", user.id)
          .maybeSingle();

        const d = (row as any)?.data || {};
        if (d.brandTone) setBrandTone(d.brandTone);
        if (d.audience) setAudience(d.audience);
        if (d.goal) setGoal(d.goal);
        if (d.competitors) setCompetitors(Array.isArray(d.competitors) ? d.competitors.join(", ") : String(d.competitors || ""));
        if (d.social?.twitter) setTwitter(d.social.twitter);
        if (d.social?.linkedin) setLinkedin(d.social.linkedin);

        const complete = Boolean(d.brandTone && d.audience && d.goal);
        if (!sessionDismissed && !complete) {
          if (mounted) setOpen(true);
        }
      } catch (e) {
        console.error("OnboardingModal init error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionDismissed]);

  const closeForSession = () => {
    sessionStorage.setItem("onboarding_modal_dismissed", "1");
    setOpen(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const payload = {
        brandTone,
        audience,
        goal,
        competitors: competitors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        social: {
          twitter: twitter || null,
          linkedin: linkedin || null,
        },
        completed: true,
      };

      // Upsert onboarding record
      const { error: upsertErr } = await supabase
        .from("onboarding")
        .upsert({ user_id: user.id, data: payload }, { onConflict: "user_id" });

      if (upsertErr) throw upsertErr;

      // Find latest company website for this user
      const { data: companies } = await supabase
        .from("crm_companies")
        .select("id, website")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const website = companies?.[0]?.website?.trim();
      if (website) {
        // Fire-and-forget research
        supabase.functions
          .invoke("company-research", { body: { url: website, company_id: companies?.[0]?.id } })
          .then(() => {
            // optional toast on completion
          })
          .catch((e) => console.error("company-research invoke error", e));
      }

      toast({ title: "Saved", description: "Thanks! We started learning about your business." });
      sessionStorage.setItem("onboarding_modal_dismissed", "1");
      setOpen(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Save failed", description: e?.message ?? "Unexpected error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeForSession())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Business Onboarding</DialogTitle>
          <DialogDescription>
            Tell us a bit more so we can tailor your workspace and content.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="brandTone">Brand tone/voice</Label>
            <Input id="brandTone" value={brandTone} onChange={(e) => setBrandTone(e.target.value)} placeholder="e.g. Professional, friendly, witty" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">Primary audience</Label>
            <Textarea id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who do you sell to? Key pain points?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Main business goal</Label>
            <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Generate 50 qualified leads/month" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="competitors">Competitors (comma-separated)</Label>
            <Input id="competitors" value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="competitor1.com, competitor2.com" />
          </div>
          <Card className="p-3">
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter / X</Label>
                <Input id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/yourhandle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/yourcompany" />
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={closeForSession}>Skip for now</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save & Continue"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BusinessOnboardingModal;
