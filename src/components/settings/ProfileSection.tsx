import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setDisplayName(data.display_name || "");
          setAvatarUrl(data.avatar_url || "");
        }
      } catch (e: any) {
        console.error(e);
        toast({ title: "Failed to load profile", description: String(e?.message || e) });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // Try update; if 0 updated, try insert
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName, avatar_url: avatarUrl })
        .eq("id", userId);

      if (upErr) throw upErr;
      toast({ title: "Profile saved", description: "Your profile has been updated." });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error saving profile", description: String(e?.message || e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !userId ? (
          <p className="text-sm text-muted-foreground">Sign in to manage your profile.</p>
        ) : (
          <>
            <div className="grid gap-1">
              <label htmlFor="displayName" className="text-sm text-muted-foreground">Display name</label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="grid gap-1">
              <label htmlFor="avatarUrl" className="text-sm text-muted-foreground">Avatar URL</label>
              <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={save} disabled={!userId || saving}>Save profile</Button>
      </CardFooter>
    </Card>
  );
}
