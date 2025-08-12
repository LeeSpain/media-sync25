
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SendPayload = {
  campaign_id?: string;
  subject?: string;
  html?: string;
  text?: string | null;
  audience?: "all";
  sendAt?: string | null; // ISO string
  from?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload = (await req.json()) as SendPayload;
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = user.id;
    const now = new Date();
    const sendAt = payload.sendAt ? new Date(payload.sendAt) : null;
    const isScheduled = !!sendAt && sendAt.getTime() > now.getTime();

    // Validate minimal inputs if creating a fresh campaign
    if (!payload.campaign_id) {
      if (!payload.subject || !payload.html) {
        return new Response(JSON.stringify({ error: "subject and html are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Load or create campaign
    let campaignId = payload.campaign_id || "";
    let subject = payload.subject || "";
    let html = payload.html || "";
    const text = payload.text || null;

    if (!campaignId) {
      const status = isScheduled ? "scheduled" : "sending";
      const { data: inserted, error: insErr } = await supabase
        .from("email_campaigns")
        .insert({
          subject,
          html,
          text,
          name: subject,
          description: null,
          provider: "resend",
          status,
          scheduled_for: isScheduled ? sendAt!.toISOString() : null,
          audience_filter: { type: payload.audience || "all" },
          statistics: {},
          created_by: userId,
        })
        .select("id")
        .maybeSingle();

      if (insErr) throw insErr;
      if (!inserted?.id) {
        throw new Error("Failed to create campaign");
      }
      campaignId = inserted.id;
    } else {
      // Ensure ownership and get essentials
      const { data: existing, error: loadErr } = await supabase
        .from("email_campaigns")
        .select("id, subject, html, text, status, created_by")
        .eq("id", campaignId)
        .maybeSingle();
      if (loadErr) throw loadErr;
      if (!existing || existing.created_by !== userId) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      subject = existing.subject;
      html = existing.html;
    }

    // Build audience (currently: all contacts with email, owned by user)
    const { data: contacts, error: contactErr } = await supabase
      .from("crm_contacts")
      .select("id, email")
      .eq("created_by", userId)
      .not("email", "is", null);
    if (contactErr) throw contactErr;

    const contactEmails = (contacts || [])
      .map((c: any) => ({ id: c.id as string, email: String(c.email) }))
      .filter((c) => !!c.email);

    // Load user suppressions and filter them out
    const { data: suppressions, error: supErr } = await supabase
      .from("email_suppressions")
      .select("email")
      .eq("created_by", userId);
    if (supErr) throw supErr;

    const suppressed = new Set((suppressions || []).map((s: any) => String(s.email).toLowerCase()));
    const recipients = contactEmails.filter((c) => !suppressed.has(c.email.toLowerCase()));

    if (recipients.length === 0) {
      // If no recipients, mark campaign as sent if it was immediate, or leave scheduled
      if (!isScheduled) {
        await supabase
          .from("email_campaigns")
          .update({ status: "sent", statistics: { sent: 0, failed: 0, total: 0 } })
          .eq("id", campaignId);
      }
      return new Response(
        JSON.stringify({ campaign_id: campaignId, message: "No eligible recipients." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Insert recipient rows (status defaults to queued)
    const toInsert = recipients.map((r) => ({
      campaign_id: campaignId,
      email_address: r.email,
      contact_id: r.id,
      status: isScheduled ? "queued" : "processing",
    }));

    const { error: recErr } = await supabase.from("email_recipients").insert(toInsert);
    if (recErr) throw recErr;

    if (isScheduled) {
      // Leave for scheduler to process later
      await supabase
        .from("email_campaigns")
        .update({ status: "scheduled" })
        .eq("id", campaignId);

      return new Response(
        JSON.stringify({
          campaign_id: campaignId,
          scheduled_for: sendAt!.toISOString(),
          recipients: recipients.length,
          status: "scheduled",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Immediate send
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    const resend = new Resend(resendApiKey);

    const fromAddress = payload.from?.trim() || "onboarding@resend.dev";

    let sent = 0;
    let failed = 0;

    // Load recipients we just inserted with status processing
    const { data: queued, error: queuedErr } = await supabase
      .from("email_recipients")
      .select("id, email_address")
      .eq("campaign_id", campaignId)
      .in("status", ["processing", "queued"]);
    if (queuedErr) throw queuedErr;

    for (const r of queued || []) {
      try {
        const response = await resend.emails.send({
          from: fromAddress,
          to: [r.email_address],
          subject,
          html,
          text: text || undefined,
        });
        // Update recipient
        await supabase
          .from("email_recipients")
          .update({
            status: "sent",
            message_id: (response as any)?.id || null,
            last_event_at: new Date().toISOString(),
          })
          .eq("id", r.id);

        // Insert event
        await supabase.from("email_events").insert({
          provider: "resend",
          event_type: "sent",
          occurred_at: new Date().toISOString(),
          created_by: userId,
          campaign_id: campaignId,
          recipient_id: r.id,
          payload: response,
        });

        sent += 1;
      } catch (err: any) {
        console.error("Send failed", r.email_address, err?.message || err);
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
          created_by: userId,
          campaign_id: campaignId,
          recipient_id: r.id,
          payload: { error: err?.message || String(err) },
        });

        failed += 1;
      }
    }

    const total = sent + failed;
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        statistics: { sent, failed, total },
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({ campaign_id: campaignId, status: "sent", sent, failed, total }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-email-campaign error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
