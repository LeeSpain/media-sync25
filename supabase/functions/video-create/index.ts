import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoCreateRequest {
  businessId: string;
  topic: string;
  script?: string;
  style?: string;
  duration?: number;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { businessId, topic, script, style = 'professional', duration = 60 }: VideoCreateRequest = await req.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('created_by', user.id)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found or access denied');
    }

    let finalScript = script;
    if (!finalScript) {
      const scriptPrompt = `Create a engaging ${duration}-second video script about "${topic}" for ${business.name}. Keep it conversational and ${style} in tone.`;

      const scriptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional video script writer.' },
            { role: 'user', content: scriptPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!scriptResponse.ok) {
        throw new Error('Failed to generate script with OpenAI');
      }

      const scriptData = await scriptResponse.json();
      finalScript = scriptData.choices[0].message.content.trim();
    }

    const { data: videoJob, error: jobError } = await supabase
      .from('video_jobs')
      .insert({
        business_id: businessId,
        created_by: user.id,
        topic,
        script: finalScript,
        style,
        duration,
        status: 'processing',
        metadata: {
          processing_steps: ['script_generated'],
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create video job: ${jobError.message}`);
    }

    try {
      await supabase.functions.invoke('scenes-generate', {
        body: {
          videoJobId: videoJob.id,
          script: finalScript,
          style
        }
      });
    } catch (invokeError) {
      console.error('Failed to invoke scenes-generate:', invokeError);
      await supabase
        .from('video_jobs')
        .update({ 
          status: 'failed',
          metadata: { 
            error: 'Failed to start scene generation process',
            processing_steps: ['script_generated', 'failed']
          }
        })
        .eq('id', videoJob.id);
      
      throw new Error('Failed to start video processing pipeline');
    }

    return new Response(JSON.stringify({
      success: true,
      videoJob,
      message: 'Video creation started successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in video-create:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});