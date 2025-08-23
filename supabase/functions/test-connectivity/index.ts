import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Test environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Testing connectivity...');
    
    // Test Supabase connection
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('id, name, active')
      .limit(5);

    if (agentsError) {
      throw new Error(`Supabase error: ${agentsError.message}`);
    }

    // Test OpenAI connection (lightweight)
    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        supabase: {
          connected: true,
          agents_count: agents?.length || 0,
          sample_agents: agents?.map(a => ({ id: a.id, name: a.name, active: a.active })) || []
        },
        openai: {
          connected: true,
          api_accessible: true
        },
        environment: {
          supabase_url: !!supabaseUrl,
          supabase_key: !!supabaseKey,
          openai_key: !!openaiApiKey
        }
      }
    };

    console.log('Connectivity test passed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Connectivity test failed:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});