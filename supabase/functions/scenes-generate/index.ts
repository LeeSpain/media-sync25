import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SceneGenerateRequest {
  videoJobId: string;
  script: string;
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

    await supabase
      .from('video_jobs')
      .update({ 
        status: 'generating_scenes',
        metadata: { 
          processing_steps: ['script_generated', 'generating_scenes']
        }
      })
      .eq('id', videoJobId);

    const scriptSegments = script.split(/[.!?]+/).filter(segment => segment.trim().length > 0);
    const scenes = [];

    for (let i = 0; i < scriptSegments.length; i++) {
      const segment = scriptSegments[i].trim();
      if (!segment) continue;

      const scenePrompt = `Create a visual scene description for: "${segment}". Style: ${style}. Return JSON with: visual_description, camera_angle, lighting, props, duration.`;

      const sceneResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a video director. Always respond with valid JSON.' },
            { role: 'user', content: scenePrompt }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!sceneResponse.ok) {
        throw new Error(`Failed to generate scene ${i + 1}`);
      }

      const sceneData = await sceneResponse.json();
      let sceneDetails;
      
      try {
        sceneDetails = JSON.parse(sceneData.choices[0].message.content);
      } catch (parseError) {
        sceneDetails = {
          visual_description: `Scene showing: ${segment}`,
          camera_angle: 'Medium shot',
          lighting: 'Natural lighting',
          props: 'Minimal props',
          duration: 5
        };
      }

      scenes.push({
        scene_number: i + 1,
        script_text: segment,
        ...sceneDetails
      });
    }

    try {
      await supabase.functions.invoke('tts-elevenlabs', {
        body: {
          videoJobId,
          text: script,
          voice: 'Aria',
          model: 'eleven_multilingual_v2'
        }
      });
    } catch (ttsError) {
      console.error('TTS generation failed:', ttsError);
    }

    await supabase
      .from('video_jobs')
      .update({ 
        status: 'scenes_generated',
        metadata: { 
          processing_steps: ['script_generated', 'scenes_generated'],
          scenes,
          total_scenes: scenes.length
        }
      })
      .eq('id', videoJobId);

    return new Response(JSON.stringify({
      success: true,
      scenes,
      message: 'Scenes generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scenes-generate:', error);
    
    const { videoJobId } = await req.json().catch(() => ({}));
    if (videoJobId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          metadata: { 
            error: error.message,
            processing_steps: ['script_generated', 'failed']
          }
        })
        .eq('id', videoJobId);
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