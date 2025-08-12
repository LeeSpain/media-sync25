
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function QuickCampaignForm() {
  const [from, setFrom] = useState<string>("onboarding@resend.dev");
  const [subject, setSubject] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [sendAt, setSendAt] = useState<string>(""); // datetime-local value
  const [loading, setLoading] = useState(false);

  const onSend = async (scheduled: boolean) => {
    try {
      if (!subject.trim() || !html.trim()) {
        toast({ title: "Missing info", description: "Please add subject and content.", variant: "destructive" });
        return;
      }
      const isScheduled = scheduled && !!sendAt;
      if (scheduled && !sendAt) {
        toast({ title: "Schedule time required", description: "Pick a date and time to schedule.", variant: "destructive" });
        return;
      }
      setLoading(true);

      const payload: any = {
        subject: subject.trim(),
        html,
        text: null,
        audience: "all",
        from: from.trim(),
        sendAt: isScheduled ? new Date(sendAt).toISOString() : null,
      };

      const { data, error } = await supabase.functions.invoke("send-email-campaign", {
        body: payload,
      });

      if (error) {
        toast({ title: "Failed", description: error.message || "Could not send campaign.", variant: "destructive" });
        return;
      }

      if (payload.sendAt) {
        toast({
          title: "Campaign scheduled",
          description: `Scheduled for ${new Date(payload.sendAt).toLocaleString()} (${data?.recipients ?? 0} recipients).`,
        });
      } else {
        toast({
          title: "Campaign sent",
          description: `Sent to ${data?.sent ?? 0} recipients (${data?.failed ?? 0} failed).`,
        });
      }

      // Reset form on success
      setSubject("");
      setHtml("");
      setSendAt("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Campaign</CardTitle>
        <CardDescription>Compose a simple email and send it to all contacts with an email address or schedule it for later.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              placeholder="you@yourdomain.com"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use a verified domain in Resend for best deliverability.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="html">Content (HTML)</Label>
          <Textarea
            id="html"
            placeholder="<p>Your message...</p>"
            rows={10}
            value={html}
            onChange={(e) => setHtml(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Paste or type HTML content. Plain text is supported automatically.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sendAt">Schedule (optional)</Label>
            <Input
              id="sendAt"
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to send immediately.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <Button className="w-full" onClick={() => onSend(false)} disabled={loading}>
              Send now
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => onSend(true)} disabled={loading}>
              Schedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
