import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_ROLE = env("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = env("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    global: { headers: { Authorization: `Bearer ${SERVICE_ROLE}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { url, company_id } = await req.json();
    if (!url || !company_id) {
      return new Response(JSON.stringify({ error: "url and company_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company to link created_by
    const { data: company, error: companyErr } = await supabase
      .from("crm_companies")
      .select("id, created_by, website")
      .eq("id", company_id)
      .maybeSingle();

    if (companyErr || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create pending research row
    const { data: inserted, error: insertErr } = await supabase
      .from("company_research")
      .insert({
        created_by: (company as any).created_by,
        company_id,
        status: "pending",
        source_url: url,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;
    const researchId = inserted.id as string;

    // Crawl website (simple HTML fetch)
    let html = "";
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "Media-SyncBot/1.0 (+https://mediasync.ai)" },
      });
      html = await resp.text();
      // Truncate to avoid token overflow
      if (html.length > 120_000) html = html.slice(0, 120_000);
    } catch (e) {
      console.warn("Failed to fetch site", e);
    }

    // Build prompt for summarization
    const prompt = `You are an analyst. Read the provided company homepage content and return a concise JSON object with:\n{
  "summary": string (<= 120 words),
  "brand_voice": { "tone": string, "style": string },
  "content_pillars": string[] (3-5),
  "competitors": string[] (0-5, domains or names if detectable),
  "industry_trends": string[] (3-5 relevant trends),
  "needs": string[] (top 3-5 likely business needs this company has)
}
Only return JSON.\n\nContent:\n${html}`;

    // Call OpenAI
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a precise business research assistant. Always return valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const aiJson = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiJson?.error?.message || "OpenAI request failed");

    const content: string = aiJson.choices?.[0]?.message?.content || "{}";
    let insights: any;
    try {
      insights = JSON.parse(content);
    } catch (_e) {
      insights = { summary: content };
    }

    // Normalize fields
    const brand_voice = insights.brand_voice ?? {};
    const content_pillars = Array.isArray(insights.content_pillars) ? insights.content_pillars : [];
    const competitors = Array.isArray(insights.competitors) ? insights.competitors : [];
    const industry_trends = Array.isArray(insights.industry_trends) ? insights.industry_trends : [];

    // Update research row
    const { error: updErr } = await supabase
      .from("company_research")
      .update({
        status: "completed",
        insights,
        brand_voice,
        content_pillars,
        competitors,
        industry_trends,
        raw_content: html || null,
      })
      .eq("id", researchId);

    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ success: true, id: researchId, insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("company-research error", error);
    // Best-effort: try to mark as failed if we created a row
    try {
      const body = await req.clone().json();
      const { company_id } = body || {};
      // Optional: no-op here without research id
    } catch (_) {}
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
