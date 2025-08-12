import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateVideoBody {
  companyName?: string;
  type?: string;
  style?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  try {
    const body = (await req.json()) as CreateVideoBody;
    const companyName = body.companyName || "Workspace";
    const type = body.type || "intro";
    const style = body.style || "professional";

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask OpenAI to produce a structured script
    const prompt = `Create a concise video script as JSON. Company: ${companyName}. Type: ${type}. Style: ${style}.\nReturn JSON with keys: title, duration_seconds (approx), scenes (array of {voiceover, visual_description}). No extra text.`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You return only valid JSON strictly matching the requested schema." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text();
      console.error("OpenAI error:", errTxt);
      throw new Error("Failed to generate script");
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || "";

    // Ensure JSON parsing
    let script: any = {};
    try {
      // If content might be wrapped in code fences, strip them
      const cleaned = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
      script = JSON.parse(cleaned);
    } catch (e) {
      console.error("Script JSON parse failed. Raw content:\n", content);
      throw new Error("AI did not return valid JSON");
    }

    // Insert video record
    const { data: videoInsert, error: videoErr } = await supabase
      .from("videos")
      .insert({
        created_by: authData.user.id,
        company_name: companyName,
        type,
        style,
        status: "processing",
        script,
        title: script?.title ?? `${companyName} - ${type}`,
        duration_seconds: script?.duration_seconds ?? null,
      })
      .select("id")
      .single();

    if (videoErr) {
      console.error("video insert error", videoErr);
      throw new Error("Failed to create video record");
    }

    // Add a completed job for script generation
    await supabase.from("video_jobs").insert({
      video_id: videoInsert.id,
      created_by: authData.user.id,
      job_type: "generate_script",
      status: "completed",
      result: { script },
    });

    return new Response(
      JSON.stringify({ videoId: videoInsert.id, script }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("video-create error", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
