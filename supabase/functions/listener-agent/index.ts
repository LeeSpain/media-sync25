import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListenerRequest {
  businessId: string;
  leadId?: string;
  action: 'analyzeResponse' | 'classifyIntent' | 'generateAutoResponse';
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { businessId, leadId, action, data } = await req.json() as ListenerRequest;

    console.log(`Listener Agent: ${action} for business ${businessId}`);

    let result;
    switch (action) {
      case 'analyzeResponse':
        result = await analyzeResponse(supabase, openaiApiKey, data);
        break;
      case 'classifyIntent':
        result = await classifyIntent(supabase, openaiApiKey, leadId!, data);
        break;
      case 'generateAutoResponse':
        result = await generateAutoResponse(supabase, openaiApiKey, leadId!, data, businessId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Listener Agent error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeResponse(supabase: any, openaiApiKey: string, data: any) {
  console.log('Analyzing response:', data.interactionId);

  const { interactionId, responseContent } = data;

  // Sentiment and Intent Analysis
  const analysisPrompt = `
Analyze this customer response for sentiment, intent, and next actions:

CUSTOMER RESPONSE:
"${responseContent}"

Provide comprehensive analysis:

1. SENTIMENT ANALYSIS (-1.0 to 1.0):
   - Overall emotional tone
   - Specific emotions detected
   - Confidence level

2. INTENT CLASSIFICATION:
   - interested (wants to learn more)
   - pricing (asking about cost)
   - objection (has concerns/hesitations)
   - not_interested (clearly declining)
   - question (seeking information)
   - scheduling (wants to meet/call)
   - complaint (expressing dissatisfaction)

3. URGENCY DETECTION:
   - high (immediate need, time-sensitive)
   - medium (considering options)
   - low (just browsing/researching)

4. NEXT ACTION:
   - immediate_human_handoff
   - send_pricing_info
   - address_objection
   - schedule_demo
   - nurture_sequence
   - close_conversation

JSON Response:
{
  "sentiment_score": 0.75,
  "sentiment_emotions": ["curious", "interested", "cautious"],
  "sentiment_confidence": 0.88,
  "intent_classification": "pricing",
  "intent_confidence": 0.92,
  "urgency_detected": "medium",
  "urgency_confidence": 0.85,
  "next_action_recommended": "send_pricing_info",
  "requires_human": false,
  "key_phrases": ["how much", "interested but", "need to know cost"],
  "objections_detected": ["cost concerns"],
  "positive_signals": ["definitely interested", "sounds good"],
  "conversation_stage": "consideration"
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert in conversation analysis and customer psychology. Always respond with valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.2,
    }),
  });

  const aiResponse = await response.json();
  let analysis;

  try {
    analysis = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    analysis = {
      sentiment_score: 0.0,
      intent_classification: 'question',
      urgency_detected: 'medium',
      next_action_recommended: 'nurture_sequence',
      requires_human: false,
    };
  }

  // Update interaction with analysis
  await supabase
    .from('lead_interactions')
    .update({
      sentiment_score: analysis.sentiment_score,
      intent_classification: analysis.intent_classification,
      urgency_detected: analysis.urgency_detected,
      next_action_recommended: analysis.next_action_recommended,
      requires_human: analysis.requires_human,
    })
    .eq('id', interactionId);

  console.log(`Response analyzed: ${analysis.intent_classification} (${analysis.sentiment_score})`);
  return analysis;
}

async function classifyIntent(supabase: any, openaiApiKey: string, leadId: string, data: any) {
  console.log('Classifying intent for lead:', leadId);

  const { message, context } = data;

  // Get lead context
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  // Get conversation history
  const { data: history } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(10);

  const classificationPrompt = `
Classify the intent of this message within the conversation context:

LEAD PROFILE:
- ${lead.first_name} ${lead.last_name}
- Current Status: ${lead.status}
- Motivation Type: ${lead.motivation_type}
- Urgency Level: ${lead.urgency_level}

CONVERSATION HISTORY:
${history?.map(h => `${h.direction}: ${h.intent_classification} - "${h.content.substring(0, 100)}..."`).join('\n') || 'No history'}

CURRENT MESSAGE:
"${message}"

CONTEXT: ${context || 'General conversation'}

Classify the intent and determine response strategy:

{
  "primary_intent": "interested|pricing|objection|not_interested|question|scheduling|complaint",
  "secondary_intents": ["cost_concern", "timing_issue"],
  "confidence_score": 0.91,
  "conversation_temperature": "hot|warm|cold",
  "stage_progression": "awareness|consideration|decision|purchase",
  "response_urgency": "immediate|within_hour|next_business_day",
  "suggested_response_type": "human_handoff|automated_info|objection_handler|nurture_content",
  "lead_score_adjustment": 5,
  "conversion_probability_change": 0.15
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert at understanding customer intent and conversation flow. Always respond with valid JSON.' },
        { role: 'user', content: classificationPrompt }
      ],
      temperature: 0.3,
    }),
  });

  const aiResponse = await response.json();
  let classification;

  try {
    classification = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    classification = {
      primary_intent: 'question',
      confidence_score: 0.5,
      conversation_temperature: 'warm',
      suggested_response_type: 'automated_info',
    };
  }

  // Update lead based on classification
  const newScore = Math.max(0, Math.min(100, lead.ai_score + (classification.lead_score_adjustment || 0)));
  const newStatus = classification.conversation_temperature === 'hot' ? 'hot' : 
                   classification.conversation_temperature === 'warm' ? 'qualified' : lead.status;

  await supabase
    .from('leads')
    .update({
      ai_score: newScore,
      status: newStatus,
      last_engagement: new Date().toISOString(),
    })
    .eq('id', leadId);

  console.log(`Intent classified: ${classification.primary_intent} (${classification.confidence_score})`);
  return classification;
}

async function generateAutoResponse(supabase: any, openaiApiKey: string, leadId: string, data: any, businessId: string) {
  console.log('Generating auto-response for lead:', leadId);

  const { message, intent, urgency } = data;

  // Get business and lead context
  const [businessResponse, leadResponse] = await Promise.all([
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('leads').select('*').eq('id', leadId).single()
  ]);

  const business = businessResponse.data;
  const lead = leadResponse.data;

  // Get conversation history
  const { data: history } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(5);

  const responsePrompt = `
Generate an appropriate auto-response for this customer interaction:

BUSINESS: ${business.name} - ${business.description}

CUSTOMER PROFILE:
- ${lead.first_name} ${lead.last_name}
- Motivation: ${lead.motivation_type}
- Urgency: ${lead.urgency_level}
- Current Score: ${lead.ai_score}/100

CUSTOMER MESSAGE:
"${message}"

DETECTED INTENT: ${intent}
URGENCY LEVEL: ${urgency}

CONVERSATION HISTORY:
${history?.map(h => `${h.direction}: "${h.content.substring(0, 50)}..."`).join('\n') || 'First interaction'}

Response Guidelines by Intent:
- interested: Provide helpful info, soft CTA
- pricing: Share pricing guide, offer consultation
- objection: Address concern, provide reassurance
- question: Answer directly, offer more info
- scheduling: Provide booking options
- not_interested: Polite acknowledgment, future nurture

Create a response that:
1. Feels personal and human
2. Addresses their specific concern
3. Moves conversation forward appropriately
4. Matches their communication style

{
  "response_content": "Thank you for your interest, ${lead.first_name}! Based on your question about...",
  "response_tone": "professional|friendly|educational",
  "includes_cta": true,
  "cta_text": "Would you like to schedule a brief call to discuss your specific needs?",
  "follow_up_recommended": true,
  "follow_up_timing": "3 days",
  "attachments_suggested": ["pricing_guide", "testimonials"],
  "estimated_satisfaction": 85
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert customer service AI that creates helpful, personalized responses. Always respond with valid JSON.' },
        { role: 'user', content: responsePrompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiResponse = await response.json();
  let autoResponse;

  try {
    autoResponse = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    autoResponse = {
      response_content: `Thank you for your message, ${lead.first_name}. I'll make sure someone gets back to you soon.`,
      response_tone: 'professional',
      includes_cta: false,
    };
  }

  // Log the auto-response
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      channel: 'email', // Default channel
      direction: 'outbound',
      content: autoResponse.response_content,
      intent_classification: 'auto_response',
      auto_response_sent: true,
      auto_response_content: autoResponse.response_content,
    });

  console.log(`Auto-response generated for ${lead.first_name}`);
  return autoResponse;
}