import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResultSummary {
  processed: number;
  successes: number;
  failures: number;
  details: Array<{ id: string; status: string; message?: string }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE env configuration" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const nowIso = new Date().toISOString();

    const { data: schedules, error: schErr } = await supabase
      .from("content_schedule")
      .select("id, content_id, channel, connected_account_id, scheduled_for, status")
      .eq("status", "scheduled")
      .lte("scheduled_for", nowIso)
      .eq("created_by", user.id)
      .order("scheduled_for", { ascending: true })
      .limit(25);

    if (schErr) throw schErr;

    const summary: ResultSummary = { processed: 0, successes: 0, failures: 0, details: [] };

    if (!schedules || schedules.length === 0) {
      return new Response(
        JSON.stringify({ ...summary, message: "No due schedules found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    for (const s of schedules) {
      summary.processed += 1;
      const scheduleId = s.id as string;

      // Move schedule to processing to avoid duplicates
      const { error: upErr } = await supabase
        .from("content_schedule")
        .update({ status: "processing" })
        .eq("id", scheduleId);
      if (upErr) {
        console.error("Failed to mark schedule processing", scheduleId, upErr);
      }

      // Fetch content
      const { data: contentItem, error: contentErr } = await supabase
        .from("content_items")
        .select("id, content, channel")
        .eq("id", s.content_id)
        .eq("created_by", user.id)
        .single();

      if (contentErr || !contentItem?.content) {
        await supabase
          .from("content_schedule")
          .update({ status: "failed", publish_result: { error: "Content not found" } })
          .eq("id", scheduleId);
        await supabase.from("publish_jobs").insert({
          provider: null,
          created_by: user.id,
          schedule_id: scheduleId,
          content_id: s.content_id,
          status: "failed",
          error: "Content not found",
          response: {},
        });
        summary.failures += 1;
        summary.details.push({ id: scheduleId, status: "failed", message: "Content not found" });
        continue;
      }

      // Fetch connected account
      const { data: account, error: accErr } = await supabase
        .from("connected_accounts")
        .select("id, provider, status, account_name")
        .eq("id", s.connected_account_id)
        .eq("created_by", user.id)
        .single();

      if (accErr || !account || account.status === "disconnected") {
        await supabase
          .from("content_schedule")
          .update({ status: "failed", publish_result: { error: "No connected account" } })
          .eq("id", scheduleId);
        await supabase.from("publish_jobs").insert({
          provider: account?.provider ?? null,
          created_by: user.id,
          schedule_id: scheduleId,
          content_id: s.content_id,
          status: "failed",
          error: "No connected account",
          response: {},
        });
        summary.failures += 1;
        summary.details.push({ id: scheduleId, status: "failed", message: "No connected account" });
        continue;
      }

      if (account.provider !== "twitter") {
        await supabase
          .from("content_schedule")
          .update({ status: "failed", publish_result: { error: `Provider ${account.provider} not supported yet` } })
          .eq("id", scheduleId);
        await supabase.from("publish_jobs").insert({
          provider: account.provider,
          created_by: user.id,
          schedule_id: scheduleId,
          content_id: s.content_id,
          status: "failed",
          error: `Provider ${account.provider} not supported yet` ,
          response: {},
        });
        summary.failures += 1;
        summary.details.push({ id: scheduleId, status: "failed", message: `Provider ${account.provider} not supported yet` });
        continue;
      }

      // Create a job in queued state
      const { data: jobRow, error: jobErr } = await supabase
        .from("publish_jobs")
        .insert({
          provider: account.provider,
          created_by: user.id,
          schedule_id: scheduleId,
          content_id: s.content_id,
          status: "queued",
          response: {},
        })
        .select("id")
        .single();

      if (jobErr) {
        console.error("Failed to create job", jobErr);
      }

      // Attempt to publish via existing function; will fail now without keys, but path is wired
      const text = contentItem.content as string;
      let publishOk = false;
      let publishResp: any = {};
      let publishErrMsg: string | undefined;
      try {
        const { data, error } = await supabase.functions.invoke("publish-twitter", {
          body: { text },
        });
        if (error) throw error;
        publishOk = !!data?.success;
        publishResp = data ?? {};
      } catch (err: any) {
        publishOk = false;
        publishErrMsg = err?.message ?? "Publish error";
      }

      if (publishOk) {
        await supabase
          .from("publish_jobs")
          .update({ status: "completed", response: publishResp })
          .eq("id", jobRow?.id);
        await supabase
          .from("content_schedule")
          .update({ status: "completed", publish_result: publishResp })
          .eq("id", scheduleId);
        summary.successes += 1;
        summary.details.push({ id: scheduleId, status: "completed" });
      } else {
        await supabase
          .from("publish_jobs")
          .update({ status: "failed", error: publishErrMsg ?? "Unknown error", response: publishResp })
          .eq("id", jobRow?.id);
        await supabase
          .from("content_schedule")
          .update({ status: "failed", publish_result: { error: publishErrMsg ?? "Unknown error", response: publishResp } })
          .eq("id", scheduleId);
        summary.failures += 1;
        summary.details.push({ id: scheduleId, status: "failed", message: publishErrMsg ?? "Unknown error" });
      }
    }

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("run-scheduler error", error);
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
