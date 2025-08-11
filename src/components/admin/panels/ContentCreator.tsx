
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

type Company = { id: string; name: string | null; website: string | null };

const kinds = [
  { value: "social_post", label: "Social Post" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "youtube_script", label: "YouTube Script" },
  { value: "youtube_video", label: "YouTube Video" },
] as const;

const channels = [
  { value: "social", label: "Social" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "youtube", label: "YouTube" },
] as const;

export default function ContentCreator() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [companyId, setCompanyId] = useState<string>("");
  const [kind, setKind] = useState<(typeof kinds)[number]["value"]>("social_post");
  const [channel, setChannel] = useState<(typeof channels)[number]["value"]>("social");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["companies-lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_companies")
        .select("id,name,website")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });

  const createContent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!companyId) throw new Error("Select a company");
      const { error } = await supabase.from("content_items").insert([
        {
          created_by: user.id,
          company_id: companyId,
          kind,
          channel,
          title: title || null,
          content,
          status: "draft",
        },
      ]);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Content saved", description: "Draft created in your library." });
      setTitle("");
      setContent("");
      await qc.invalidateQueries({ queryKey: ["content_items"] });
    },
    meta: { onError: true },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Creator (Manual)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label>Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {(companies ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || c.website || c.id.slice(0, 6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {kinds.map((k) => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional title" />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Write or paste content..." />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => createContent.mutate()} disabled={!user || createContent.isPending || !companyId || !content}>
            {createContent.isPending ? "Saving..." : "Save Draft"}
          </Button>
          <Button variant="secondary" disabled title="AI generation will be enabled after OpenAI key is configured.">
            Generate with AI (coming soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
