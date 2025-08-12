import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TTSBody {
  videoId: string;
  voiceId?: string; // ElevenLabs voice ID
  modelId?: string; // eleven_turbo_v2_5 (default)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  try {
    const body = (await req.json()) as TTSBody;
    const voiceId = body.voiceId || "9BWtsMINqrJLrRacOk9x"; // Aria default
    const modelId = body.modelId || "eleven_turbo_v2_5";

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load video
    const { data: video, error: videoErr } = await supabase
      .from("videos")
      .select("id, created_by, script, title")
      .eq("id", body.videoId)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce ownership
    if (video.created_by !== authData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scenes: Array<{ voiceover?: string }> = (video as any).script?.scenes || [];
    const narration = scenes.map((s) => s.voiceover?.trim()).filter(Boolean).join("\n\n");

    if (!narration) {
      return new Response(JSON.stringify({ error: "No narration text found in script" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate TTS
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: narration,
        model_id: modelId,
        voice_settings: { stability: 0.4, similarity_boost: 0.8 },
        output_format: "mp3_44100_128",
      }),
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("ElevenLabs error:", errText);
      throw new Error("Failed to generate TTS");
    }

    const audioArrayBuffer = await ttsRes.arrayBuffer();
    const audioBytes = new Uint8Array(audioArrayBuffer);

    const audioPath = `videos/${authData.user.id}/${video.id}/voice.mp3`;

    // Upload to storage
    const { error: uploadErr } = await supabase.storage
      .from("videos")
      .upload(audioPath, audioBytes, { contentType: "audio/mpeg", upsert: true });

    if (uploadErr) {
      console.error("upload error", uploadErr);
      throw new Error("Failed to upload audio");
    }

    await supabase.from("video_jobs").insert({
      video_id: video.id,
      created_by: authData.user.id,
      job_type: "generate_tts",
      status: "completed",
      result: { audio_path: audioPath, voice_id: voiceId },
    });

    return new Response(JSON.stringify({ audioPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("tts-elevenlabs error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
