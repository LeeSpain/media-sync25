import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  videoJobId?: string;
  text: string;
  voice?: string;
  model?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { videoJobId, text, voice = 'Aria', model = 'eleven_multilingual_v2' }: TTSRequest = await req.json();

    // Map voice names to ElevenLabs voice IDs
    const voiceMap: { [key: string]: string } = {
      'Aria': '9BWtsMINqrJLrRacOk9x',
      'Roger': 'CwhRBWXzGAHq8TQ4Fs17',
      'Sarah': 'EXAVITQu4vr4xnSDxMaL',
      'Laura': 'FGY2WhTYpPnrIDTdsKH5',
      'Charlie': 'IKne3meq5aSn9XLyUdCD',
      'alloy': '9BWtsMINqrJLrRacOk9x' // Default to Aria for compatibility
    };

    const voiceId = voiceMap[voice] || voiceMap['Aria'];

    // Generate speech using ElevenLabs API
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`TTS generation failed: ${errorText}`);
    }

    // Convert audio to base64 for storage/transmission
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    // If this is part of a video job, update the job
    if (videoJobId) {
      await supabase
        .from('video_jobs')
        .update({ 
          status: 'audio_generated',
          metadata: { 
            processing_steps: ['script_generated', 'scenes_generated', 'audio_generated'],
            audio_base64: base64Audio
          }
        })
        .eq('id', videoJobId);
    }

    // Store audio in Supabase Storage if needed
    let audioUrl = null;
    try {
      const fileName = `audio_${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg'
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(uploadData.path);
        audioUrl = urlData.publicUrl;
      }
    } catch (storageError) {
      console.warn('Failed to store audio in Supabase Storage:', storageError);
    }

    return new Response(JSON.stringify({
      success: true,
      audioBase64: base64Audio,
      audioUrl,
      message: 'Audio generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tts-elevenlabs:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});