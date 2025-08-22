import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchAgentRequest {
  businessId: string;
  action: 'analyze_website' | 'competitor_research' | 'social_presence';
  data?: any;
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

    const { businessId, action, data }: ResearchAgentRequest = await req.json();
    console.log(`Research Agent: ${action} for business ${businessId}`);

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    let result;

    switch (action) {
      case 'analyze_website':
        result = await analyzeWebsite(supabase, openaiKey, business);
        break;
      case 'competitor_research':
        result = await researchCompetitors(supabase, openaiKey, business);
        break;
      case 'social_presence':
        result = await analyzeSocialPresence(supabase, openaiKey, business);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in research-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function analyzeWebsite(supabase: any, openaiKey: string, business: any) {
  console.log('Research Agent: Analyzing website', business.website_url);

  if (!business.website_url) {
    throw new Error('No website URL provided');
  }

  try {
    // Fetch website content (simple version - in production you'd want more sophisticated scraping)
    let websiteContent = '';
    try {
      const websiteResponse = await fetch(business.website_url);
      const html = await websiteResponse.text();
      
      // Extract text content (basic HTML stripping)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      websiteContent = textContent.substring(0, 5000); // Limit content length
    } catch (fetchError) {
      console.warn('Failed to fetch website content:', fetchError);
      websiteContent = `Website: ${business.website_url}. Unable to fetch content.`;
    }

    // Use OpenAI to analyze the website content
    const analysisPrompt = `
Analyze this business website and extract key information:

Business Name: ${business.name}
Website: ${business.website_url}
Content: ${websiteContent}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "summary": "Brief business summary",
  "industry": "Primary industry/sector",
  "products_services": ["list", "of", "main", "offerings"],
  "target_audience": "Description of target customers",
  "value_proposition": "Main value proposition",
  "brand_voice": {
    "tone": "professional/casual/friendly/authoritative",
    "style": "formal/conversational/technical/creative",
    "personality": "Description of brand personality"
  },
  "content_pillars": ["pillar1", "pillar2", "pillar3"],
  "competitive_advantages": ["advantage1", "advantage2"],
  "business_model": "Description of how they make money",
  "geographic_focus": "Local/National/Global and specific regions if mentioned"
}

Be thorough but concise. If information isn't clearly available, indicate with "Not specified" rather than guessing.
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a business research specialist. Analyze websites and extract structured business intelligence.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
    }

    const openaiResult = await openaiResponse.json();
    const analysisText = openaiResult.choices[0].message.content;

    // Parse the JSON response
    let researchData;
    try {
      researchData = JSON.parse(analysisText);
    } catch (parseError) {
      console.warn('Failed to parse OpenAI response as JSON, using raw text');
      researchData = {
        summary: analysisText,
        analysis_raw: analysisText,
        parsed: false
      };
    }

    // Update business with research data
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        research_data: researchData,
        research_status: 'completed',
        industry: researchData.industry || business.industry,
        description: researchData.summary || business.description,
        brand_guidelines: researchData.brand_voice || {}
      })
      .eq('id', business.id);

    if (updateError) {
      throw new Error('Failed to save research data');
    }

    // Update the task status
    const { error: taskError } = await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        output_data: researchData,
        completed_at: new Date().toISOString()
      })
      .eq('business_id', business.id)
      .eq('agent_type', 'research')
      .eq('task_type', 'website_analysis')
      .eq('status', 'pending');

    return {
      success: true,
      message: 'Website analysis completed',
      data: researchData
    };

  } catch (error) {
    // Update task with error status
    await supabase
      .from('agent_tasks')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('business_id', business.id)
      .eq('agent_type', 'research')
      .eq('task_type', 'website_analysis')
      .eq('status', 'pending');

    throw error;
  }
}

async function researchCompetitors(supabase: any, openaiKey: string, business: any) {
  console.log('Research Agent: Researching competitors for', business.name);

  const competitorPrompt = `
Research competitors and industry trends for this business:

Business: ${business.name}
Industry: ${business.industry || 'Not specified'}
Website: ${business.website_url}
Description: ${business.description || 'Not specified'}

Please provide competitor analysis in JSON format:
{
  "direct_competitors": [
    {
      "name": "Competitor name",
      "website": "URL if known",
      "strengths": ["strength1", "strength2"],
      "market_position": "Description"
    }
  ],
  "indirect_competitors": [
    {
      "name": "Competitor name",
      "category": "Why they compete indirectly"
    }
  ],
  "industry_trends": ["trend1", "trend2", "trend3"],
  "market_opportunities": ["opportunity1", "opportunity2"],
  "content_gaps": ["What competitors aren't doing well"],
  "recommended_positioning": "How to differentiate"
}

Base this on general industry knowledge, not real-time data.
`;

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a competitive intelligence analyst. Provide strategic business insights.' },
        { role: 'user', content: competitorPrompt }
      ],
      temperature: 0.4,
    }),
  });

  if (!openaiResponse.ok) {
    throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
  }

  const openaiResult = await openaiResponse.json();
  const competitorAnalysis = openaiResult.choices[0].message.content;

  let competitorData;
  try {
    competitorData = JSON.parse(competitorAnalysis);
  } catch (parseError) {
    competitorData = {
      analysis_raw: competitorAnalysis,
      parsed: false
    };
  }

  // Update business research data
  const currentResearchData = business.research_data || {};
  const updatedResearchData = {
    ...currentResearchData,
    competitor_analysis: competitorData
  };

  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      research_data: updatedResearchData
    })
    .eq('id', business.id);

  if (updateError) {
    throw new Error('Failed to save competitor research');
  }

  return {
    success: true,
    message: 'Competitor research completed',
    data: competitorData
  };
}

async function analyzeSocialPresence(supabase: any, openaiKey: string, business: any) {
  console.log('Research Agent: Analyzing social presence for', business.name);

  // This would integrate with social media APIs in a full implementation
  // For now, we'll provide strategic recommendations based on the business info

  const socialPrompt = `
Based on this business information, recommend a social media strategy:

Business: ${business.name}
Industry: ${business.industry}
Target Audience: ${business.research_data?.target_audience || 'General'}
Brand Voice: ${JSON.stringify(business.brand_guidelines)}

Provide social media strategy in JSON format:
{
  "recommended_platforms": [
    {
      "platform": "platform_name",
      "priority": "high/medium/low",
      "reasoning": "Why this platform",
      "content_types": ["posts", "stories", "reels", "etc"],
      "posting_frequency": "X times per week"
    }
  ],
  "content_pillars": ["pillar1", "pillar2", "pillar3"],
  "hashtag_strategy": {
    "branded": ["#brand1", "#brand2"],
    "industry": ["#industry1", "#industry2"],
    "trending": ["#trend1", "#trend2"]
  },
  "optimal_posting_times": {
    "weekdays": "9-11am, 1-3pm",
    "weekends": "10-12pm"
  },
  "engagement_tactics": ["tactic1", "tactic2"]
}
`;

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a social media strategist. Create comprehensive social media strategies.' },
        { role: 'user', content: socialPrompt }
      ],
      temperature: 0.4,
    }),
  });

  if (!openaiResponse.ok) {
    throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
  }

  const openaiResult = await openaiResponse.json();
  const socialStrategy = openaiResult.choices[0].message.content;

  let socialData;
  try {
    socialData = JSON.parse(socialStrategy);
  } catch (parseError) {
    socialData = {
      strategy_raw: socialStrategy,
      parsed: false
    };
  }

  // Update business research data
  const currentResearchData = business.research_data || {};
  const updatedResearchData = {
    ...currentResearchData,
    social_strategy: socialData
  };

  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      research_data: updatedResearchData
    })
    .eq('id', business.id);

  if (updateError) {
    throw new Error('Failed to save social strategy');
  }

  return {
    success: true,
    message: 'Social presence analysis completed',
    data: socialData
  };
}