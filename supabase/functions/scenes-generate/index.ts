import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScenesBody {
  videoId: string;
  width?: number;
  height?: number;
  model?: string;
}

async function runwareGenerate(prompt: string, apiKey: string, width: number, height: number, model: string) {
  const taskUUID = crypto.randomUUID();
  const payload = [
    { taskType: "authentication", apiKey },
    {
      taskType: "imageInference",
      taskUUID,
      positivePrompt: prompt,
      width,
      height,
      model,
      numberResults: 1,
      outputFormat: "WEBP",
      CFGScale: 1,
      scheduler: "FlowMatchEulerDiscreteScheduler",
      strength: 0.8,
      lora: [],
    },
  ];

  const res = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Runware API error: ${text}`);
  }

  const json = await res.json();
  const item = json?.data?.find((x: any) => x.taskType === "imageInference" && x.imageURL);
  if (!item?.imageURL) throw new Error("No imageURL returned by Runware");
  return item.imageURL as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const RUNWARE_API_KEY = Deno.env.get("RUNWARE_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RUNWARE_API_KEY) {
    return new Response(JSON.stringify({ error: "RUNWARE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });

  try {
    const body = (await req.json()) as ScenesBody;
    const width = body.width ?? 1024;
    const height = body.height ?? 576; // 16:9
    const model = body.model ?? "runware:100@1";

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
      .select("id, created_by, script")
      .eq("id", body.videoId)
      .single();

    if (videoErr || !video) {
      return new Response(JSON.stringify({ error: "Video not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (video.created_by !== authData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scenes: Array<{ visual_description?: string }> = (video as any).script?.scenes || [];
    if (!Array.isArray(scenes) || scenes.length === 0) {
      return new Response(JSON.stringify({ error: "No scenes in script" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scenePaths: string[] = [];

    for (let i = 0; i < scenes.length; i++) {
      const desc = scenes[i].visual_description?.trim() || "Clean brand frame background";
      const imageURL = await runwareGenerate(desc, RUNWARE_API_KEY, width, height, model);

      // Download the image
      const imgRes = await fetch(imageURL);
      if (!imgRes.ok) throw new Error(`Failed to download image: ${await imgRes.text()}`);
      const imgArrayBuffer = await imgRes.arrayBuffer();
      const bytes = new Uint8Array(imgArrayBuffer);

      const scenePath = `videos/${authData.user.id}/${video.id}/scenes/scene-${String(i + 1).padStart(2, "0")}.webp`;
      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(scenePath, bytes, { contentType: "image/webp", upsert: true });

      if (upErr) throw upErr;
      scenePaths.push(scenePath);
    }

    await supabase.from("video_jobs").insert({
      video_id: video.id,
      created_by: authData.user.id,
      job_type: "generate_scenes",
      status: "completed",
      result: { scene_paths: scenePaths },
    });

    return new Response(JSON.stringify({ scenePaths }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("scenes-generate error", error);
    return new Response(JSON.stringify({ error: error?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
