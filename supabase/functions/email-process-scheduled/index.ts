import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Campaign = {
  id: string;
  subject: string;
  html: string;
  text: string | null;
  created_by: string;
  from_address: string | null;
};

type Summary = {
  campaigns_processed: number;
  emails_sent: number;
  emails_failed: number;
  details: Array<{ campaign_id: string; sent: number; failed: number; total: number }>;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase service configuration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const resend = new Resend(resendKey);

    const nowIso = new Date().toISOString();

    // Find due campaigns
    const { data: dueCampaigns, error: dueErr } = await supabase
      .from("email_campaigns")
      .select("id, subject, html, text, created_by, from_address")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(5);

    if (dueErr) throw dueErr;

    const summary: Summary = { campaigns_processed: 0, emails_sent: 0, emails_failed: 0, details: [] };

    if (!dueCampaigns || dueCampaigns.length === 0) {
      return new Response(JSON.stringify({ ...summary, message: "No scheduled campaigns due" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    for (const c of dueCampaigns as Campaign[]) {
      summary.campaigns_processed += 1;

      // Fetch queued/processing recipients
      const { data: queued, error: qErr } = await supabase
        .from("email_recipients")
        .select("id, email_address")
        .eq("campaign_id", c.id)
        .in("status", ["queued", "processing"]);
      if (qErr) throw qErr;

      let sent = 0;
      let failed = 0;

      if (!queued || queued.length === 0) {
        // Nothing to send, mark as sent
        await supabase
          .from("email_campaigns")
          .update({ status: "sent", statistics: { sent: 0, failed: 0, total: 0 } })
          .eq("id", c.id);
        summary.details.push({ campaign_id: c.id, sent: 0, failed: 0, total: 0 });
        continue;
      }

      const from = (c.from_address?.trim() || "onboarding@resend.dev");

      for (const r of queued) {
        try {
          const response = await resend.emails.send({
            from,
            to: [r.email_address],
            subject: c.subject,
            html: c.html,
            text: c.text ?? undefined,
          });

          await supabase
            .from("email_recipients")
            .update({
              status: "sent",
              message_id: (response as any)?.id || null,
              last_event_at: new Date().toISOString(),
            })
            .eq("id", r.id);

          await supabase.from("email_events").insert({
            provider: "resend",
            event_type: "sent",
            occurred_at: new Date().toISOString(),
            created_by: c.created_by,
            campaign_id: c.id,
            recipient_id: r.id,
            payload: response,
          });

          sent += 1;
        } catch (err: any) {
          await supabase
            .from("email_recipients")
            .update({
              status: "failed",
              error: err?.message || "Send failed",
              last_event_at: new Date().toISOString(),
            })
            .eq("id", r.id);

          await supabase.from("email_events").insert({
            provider: "resend",
            event_type: "failed",
            occurred_at: new Date().toISOString(),
            created_by: c.created_by,
            campaign_id: c.id,
            recipient_id: r.id,
            payload: { error: err?.message || String(err) },
          });

          failed += 1;
        }
      }

      const total = sent + failed;
      await supabase
        .from("email_campaigns")
        .update({ status: "sent", statistics: { sent, failed, total } })
        .eq("id", c.id);

      summary.emails_sent += sent;
      summary.emails_failed += failed;
      summary.details.push({ campaign_id: c.id, sent, failed, total });
    }

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("email-process-scheduled error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
