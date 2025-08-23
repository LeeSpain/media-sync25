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
  style?: 'professional' | 'casual' | 'animated';
  duration?: number; // in seconds
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

    const { businessId, topic, script, style = 'professional', duration = 60 }: VideoCreateRequest = await req.json();

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    let finalScript = script;
    
    // Generate script if not provided
    if (!finalScript) {
      const scriptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          max_completion_tokens: 1000,
          messages: [
            {
              role: 'system',
              content: `You are a video script writer. Create engaging ${duration}-second video scripts for businesses.`
            },
            {
              role: 'user',
              content: `Create a ${duration}-second video script about "${topic}" for ${business.name}. 
              Business description: ${business.description}
              Industry: ${business.industry}
              Style: ${style}
              
              The script should be engaging, professional, and include timing markers. Format as JSON with:
              - title: Video title
              - script: Array of { time: number, text: string, action?: string }
              - estimated_duration: number in seconds`
            }
          ],
        }),
      });

      if (!scriptResponse.ok) {
        throw new Error('Failed to generate script');
      }

      const scriptData = await scriptResponse.json();
      try {
        const parsedScript = JSON.parse(scriptData.choices[0].message.content);
        finalScript = parsedScript.script;
      } catch (parseError) {
        finalScript = scriptData.choices[0].message.content;
      }
    }

    // Create video job in database
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
          created_at: new Date().toISOString(),
          processing_steps: ['script_generated']
        }
      })
      .select()
      .single();

    if (jobError) {
      throw new Error('Failed to create video job');
    }

    // Start async video generation process
    try {
      // Call scenes generation
      await supabase.functions.invoke('scenes-generate', {
        body: {
          videoJobId: videoJob.id,
          script: finalScript,
          style
        },
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        }
      });
    } catch (error) {
      console.warn('Failed to trigger scenes generation:', error);
    }

    return new Response(JSON.stringify({
      success: true,
      videoJob,
      message: 'Video creation started'
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