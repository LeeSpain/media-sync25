import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const platforms = [
  { value: "twitter", label: "X / Twitter" },
  // Future: linkedin, facebook, instagram
];

export default function SocialComposer() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platform, setPlatform] = useState<string>(platforms[0].value);
  const [loading, setLoading] = useState(false);

  const [hasConnection, setHasConnection] = useState<boolean>(false);
  const [connLoading, setConnLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!user) {
        if (active) {
          setHasConnection(false);
          setConnLoading(false);
        }
        return;
      }
      try {
        setConnLoading(true);
        const { data, error } = await supabase
          .from("connected_accounts")
          .select("id, status, created_at")
          .eq("provider", platform)
          .eq("created_by", user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (!active) return;
        if (error) {
          console.warn("Failed to load connection", error);
          setHasConnection(false);
        } else {
          const row = (data ?? [])[0];
          setHasConnection(!!row && row.status !== "disconnected");
        }
      } finally {
        if (active) setConnLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, platform]);

  const disabled = !user || !text.trim() || !platform || loading || !hasConnection || connLoading;

  const onPublish = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You must be logged in to publish.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const fullText = hashtags.trim() ? `${text.trim()}\n\n${hashtags.trim()}` : text.trim();

      if (platform === "twitter") {
        const { data, error } = await supabase.functions.invoke("publish-twitter", {
          body: { text: fullText },
        });

        if (error) throw error;

        // Store job result
        const { error: insertErr } = await supabase
          .from("publish_jobs")
          .insert({
            provider: "twitter",
            created_by: user.id,
            status: data?.success ? "completed" : "failed",
            response: data ?? {},
          });
        if (insertErr) console.warn("publish_jobs insert warning", insertErr);

        if (data?.success) {
          toast({ title: "Published on X / Twitter", description: data?.url ?? "Post created." });
          setText("");
          setHashtags("");
        } else {
          throw new Error(data?.error ?? "Failed to publish");
        }
      } else {
        toast({ title: "Unsupported platform", description: "This platform isn't ready yet.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Publish failed", description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Social Post</CardTitle>
        <CardDescription>Publish now to your selected platform. Scheduling and more platforms coming next.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm mb-2">Post content</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              placeholder="Write something engaging..."
              aria-label="Post content"
            />
            <div className="mt-2 text-xs text-muted-foreground">{text.length}/1000</div>
          </div>
          <div>
            <label className="block text-sm mb-2">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4">
              <label className="block text-sm mb-2">Hashtags (optional)</label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#marketing #growth"
                aria-label="Hashtags"
              />
              <p className="mt-1 text-xs text-muted-foreground">Separate by space. They’ll be appended to your post.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <Button onClick={onPublish} disabled={disabled}>
            {loading ? "Publishing..." : "Publish now"}
          </Button>
          {!hasConnection && !connLoading && (
            <p className="text-sm text-muted-foreground">
              Connect your {platforms.find((p) => p.value === platform)?.label} account in Settings before publishing.
              {" "}
              <Button variant="link" asChild className="px-1">
                <Link to="/dashboard/settings#admin">Open Settings</Link>
              </Button>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
