import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SceneGenerateRequest {
  videoJobId: string;
  script: string | any[];
  style: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { videoJobId, script, style }: SceneGenerateRequest = await req.json();

    // Update video job status
    await supabase
      .from('video_jobs')
      .update({ 
        status: 'generating_scenes',
        metadata: { processing_steps: ['script_generated', 'scenes_generating'] }
      })
      .eq('id', videoJobId);

    // Generate visual descriptions for each scene
    const scenes = Array.isArray(script) ? script : [{ time: 0, text: script }];
    const generatedScenes = [];

    for (const scene of scenes) {
      const sceneResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          max_completion_tokens: 500,
          messages: [
            {
              role: 'system',
              content: `You are a visual director creating scene descriptions for video production. Style: ${style}`
            },
            {
              role: 'user',
              content: `Create a detailed visual scene description for this script segment: "${scene.text}"
              
              Return JSON with:
              - visual_description: Detailed description of what should be shown
              - camera_angle: Camera positioning and movement
              - lighting: Lighting setup description
              - props: Required props and elements
              - duration: Scene duration in seconds`
            }
          ],
        }),
      });

      if (sceneResponse.ok) {
        const sceneData = await sceneResponse.json();
        try {
          const parsedScene = JSON.parse(sceneData.choices[0].message.content);
          generatedScenes.push({
            ...scene,
            ...parsedScene,
            scene_id: `scene_${generatedScenes.length + 1}`
          });
        } catch (parseError) {
          generatedScenes.push({
            ...scene,
            visual_description: sceneData.choices[0].message.content,
            scene_id: `scene_${generatedScenes.length + 1}`
          });
        }
      }
    }

    // Generate TTS audio for the script
    try {
      await supabase.functions.invoke('tts-elevenlabs', {
        body: {
          videoJobId,
          script: scenes.map(s => s.text).join(' '),
          voice: 'alloy'
        },
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        }
      });
    } catch (error) {
      console.warn('Failed to trigger TTS generation:', error);
    }

    // Update video job with generated scenes
    await supabase
      .from('video_jobs')
      .update({ 
        status: 'scenes_generated',
        metadata: { 
          processing_steps: ['script_generated', 'scenes_generated'],
          scenes: generatedScenes
        }
      })
      .eq('id', videoJobId);

    return new Response(JSON.stringify({
      success: true,
      scenes: generatedScenes,
      message: 'Scenes generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scenes-generate:', error);
    
    // Update video job status to failed
    try {
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      await supabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          metadata: { error: error.message }
        })
        .eq('id', req.url.includes('videoJobId') ? new URL(req.url).searchParams.get('videoJobId') : '');
    } catch (updateError) {
      console.error('Failed to update video job status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});