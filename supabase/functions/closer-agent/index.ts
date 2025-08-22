import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CloserRequest {
  businessId: string;
  leadId: string;
  action: 'generateOffer' | 'handleObjection' | 'closeConversation';
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

    const { businessId, leadId, action, data } = await req.json() as CloserRequest;

    console.log(`Closer Agent: ${action} for lead ${leadId}`);

    let result;
    switch (action) {
      case 'generateOffer':
        result = await generateDynamicOffer(supabase, openaiApiKey, businessId, leadId);
        break;
      case 'handleObjection':
        result = await handleObjection(supabase, openaiApiKey, leadId, data);
        break;
      case 'closeConversation':
        result = await closeConversation(supabase, openaiApiKey, leadId, data);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Closer Agent error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateDynamicOffer(supabase: any, openaiApiKey: string, businessId: string, leadId: string) {
  console.log('Generating dynamic offer for lead:', leadId);

  // Get comprehensive lead and business data
  const [leadResponse, businessResponse, predictionsResponse, pricingResponse] = await Promise.all([
    supabase.from('leads').select('*').eq('id', leadId).single(),
    supabase.from('businesses').select('*').eq('id', businessId).single(),
    supabase.from('lead_predictions').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).limit(1),
    supabase.from('dynamic_pricing').select('*').eq('business_id', businessId).eq('active', true).single()
  ]);

  const lead = leadResponse.data;
  const business = businessResponse.data;
  const predictions = predictionsResponse.data?.[0];
  const pricing = pricingResponse.data;

  // Get interaction history
  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Calculate dynamic pricing
  let finalPrice = pricing?.base_price || 299;
  
  if (pricing) {
    // Adjust based on lead score
    if (lead.ai_score >= 90) finalPrice *= pricing.lead_score_multiplier || 1.0;
    
    // Adjust based on urgency
    if (lead.urgency_level === 'immediate') finalPrice *= pricing.urgency_multiplier || 1.0;
    
    // Seasonal adjustments
    finalPrice *= pricing.seasonal_multiplier || 1.0;
  }

  const offerPrompt = `
Create a personalized, compelling offer for this high-intent lead:

LEAD PROFILE:
- ${lead.first_name} ${lead.last_name}, ${lead.age} years old
- Location: ${lead.location}
- AI Score: ${lead.ai_score}/100
- Motivation: ${lead.motivation_type}
- Urgency: ${lead.urgency_level}
- Decision Type: ${lead.decision_maker_type}

BUSINESS: ${business.name} - ${business.description}

CONVERSATION ANALYSIS:
${interactions?.map(i => `- ${i.intent_classification}: ${i.sentiment_score || 'N/A'}`).join('\n') || 'No interactions'}

PREDICTIONS:
- Conversion Probability: ${predictions?.conversion_probability || 'N/A'}
- Predicted LTV: ${predictions?.lifetime_value_prediction || 'N/A'}

CALCULATED PRICE: €${finalPrice.toFixed(2)}

Create an offer that includes:
1. Personalized value proposition
2. Price with justification
3. Urgency elements
4. Risk reversal
5. Bonus incentives
6. Clear next steps

{
  "offer_title": "Exclusive Safety Package for ${lead.first_name}",
  "value_proposition": "Based on your specific needs in ${lead.location}...",
  "price": ${finalPrice.toFixed(2)},
  "original_price": ${(finalPrice * 1.3).toFixed(2)},
  "savings_amount": ${(finalPrice * 0.3).toFixed(2)},
  "urgency_element": "This offer expires in 48 hours",
  "risk_reversal": "30-day money-back guarantee",
  "bonuses": [
    {"item": "Free installation", "value": "€50"},
    {"item": "Extended warranty", "value": "€75"}
  ],
  "payment_options": ["one-time", "3-month-plan"],
  "social_proof": "Join 500+ families in ${lead.location} who chose us",
  "objection_handlers": {
    "price": "When you consider the peace of mind...",
    "timing": "The sooner you start, the sooner you're protected"
  },
  "closing_statement": "Are you ready to secure your independence today?",
  "estimated_close_probability": 0.78
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
        { role: 'system', content: 'You are an expert sales closer who creates irresistible, personalized offers. Always respond with valid JSON.' },
        { role: 'user', content: offerPrompt }
      ],
      temperature: 0.5,
    }),
  });

  const aiResponse = await response.json();
  let offer;

  try {
    offer = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    offer = {
      offer_title: `Special Offer for ${lead.first_name}`,
      value_proposition: 'Customized solution for your needs',
      price: finalPrice.toFixed(2),
      closing_statement: 'Would you like to move forward?',
    };
  }

  // Log the offer
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      channel: 'system',
      direction: 'outbound',
      subject: offer.offer_title,
      content: JSON.stringify(offer),
      intent_classification: 'offer_presentation',
    });

  // Update lead status
  await supabase
    .from('leads')
    .update({
      status: 'offer_presented',
      last_engagement: new Date().toISOString(),
    })
    .eq('id', leadId);

  console.log(`Dynamic offer generated: €${offer.price} for ${lead.first_name}`);
  return offer;
}

async function handleObjection(supabase: any, openaiApiKey: string, leadId: string, data: any) {
  console.log('Handling objection for lead:', leadId);

  const { objection, objectionType } = data;

  // Get lead and interaction context
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(5);

  const objectionPrompt = `
Handle this customer objection with empathy and expertise:

CUSTOMER: ${lead.first_name} ${lead.last_name}
MOTIVATION TYPE: ${lead.motivation_type}
OBJECTION TYPE: ${objectionType}
SPECIFIC OBJECTION: "${objection}"

CONVERSATION CONTEXT:
${interactions?.map(i => `- ${i.intent_classification}: "${i.content.substring(0, 100)}..."`).join('\n') || 'Limited context'}

Common objection types and responses:
- price: Focus on value, ROI, cost of inaction
- timing: Create urgency, address real timing concerns
- authority: Identify real decision maker, provide materials
- need: Uncover pain points, consequences of waiting
- trust: Provide social proof, guarantees, credentials

Create a response that:
1. Acknowledges their concern
2. Provides logical counter-argument
3. Offers social proof
4. Addresses underlying emotion
5. Moves toward resolution

{
  "acknowledgment": "I completely understand your concern about...",
  "reframe": "Let me share a different perspective...",
  "evidence": "Here's what other customers in your situation found...",
  "emotional_address": "I know it feels like a big decision...",
  "bridge_to_close": "If we could address this concern, would you be ready to move forward?",
  "follow_up_question": "What specifically about the price concerns you most?",
  "success_stories": [
    "Sarah from Manchester had the same concern but found that..."
  ],
  "risk_mitigation": "We offer a 30-day guarantee to ensure...",
  "objection_strength": "medium",
  "recommended_action": "continue_conversation|schedule_call|send_materials"
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
        { role: 'system', content: 'You are an expert objection handler who helps customers overcome concerns with empathy and logic. Always respond with valid JSON.' },
        { role: 'user', content: objectionPrompt }
      ],
      temperature: 0.6,
    }),
  });

  const aiResponse = await response.json();
  let objectionResponse;

  try {
    objectionResponse = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    objectionResponse = {
      acknowledgment: "I understand your concern",
      reframe: "Let me help address that",
      bridge_to_close: "Would that help resolve your concern?",
    };
  }

  // Log the objection handling
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      channel: 'system',
      direction: 'outbound',
      subject: `Objection Response: ${objectionType}`,
      content: JSON.stringify(objectionResponse),
      intent_classification: 'objection_handling',
    });

  console.log(`Objection handled: ${objectionType} for ${lead.first_name}`);
  return objectionResponse;
}

async function closeConversation(supabase: any, openaiApiKey: string, leadId: string, data: any) {
  console.log('Closing conversation for lead:', leadId);

  const { outcome, reason } = data; // outcome: 'won', 'lost', 'nurture'

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  // Get all interactions for analysis
  const { data: allInteractions } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  const closingPrompt = `
Generate a closing message and conversation summary:

LEAD: ${lead.first_name} ${lead.last_name}
OUTCOME: ${outcome}
REASON: ${reason || 'Not specified'}

CONVERSATION JOURNEY:
${allInteractions?.map((i, idx) => `${idx + 1}. ${i.intent_classification}: ${i.sentiment_score || 'N/A'}`).join('\n') || 'No interactions'}

Generate appropriate closing based on outcome:
- won: Congratulations, next steps, onboarding
- lost: Graceful exit, future opportunities, value delivered
- nurture: Long-term relationship, periodic check-ins

{
  "closing_message": "Thank you for your time, ${lead.first_name}...",
  "outcome_summary": "Customer decided to...",
  "lessons_learned": ["Price sensitivity higher than expected"],
  "follow_up_strategy": "3-month check-in email",
  "referral_request": "If you know anyone who might benefit...",
  "conversion_analysis": {
    "total_touchpoints": ${allInteractions?.length || 0},
    "conversation_duration_days": 7,
    "key_turning_points": ["Initial interest", "Price objection"],
    "missed_opportunities": ["Could have addressed price earlier"]
  },
  "future_probability": 0.3,
  "recommended_nurture_timing": "3 months"
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
        { role: 'system', content: 'You are an expert at gracefully closing sales conversations and analyzing outcomes. Always respond with valid JSON.' },
        { role: 'user', content: closingPrompt }
      ],
      temperature: 0.5,
    }),
  });

  const aiResponse = await response.json();
  let closing;

  try {
    closing = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    closing = {
      closing_message: `Thank you for your time, ${lead.first_name}. It was a pleasure speaking with you.`,
      outcome_summary: `Conversation ended: ${outcome}`,
    };
  }

  // Update lead final status
  const finalStatus = outcome === 'won' ? 'converted' : 
                     outcome === 'lost' ? 'closed_lost' : 
                     'nurture';

  await supabase
    .from('leads')
    .update({
      status: finalStatus,
      last_engagement: new Date().toISOString(),
    })
    .eq('id', leadId);

  // Log closing interaction
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      channel: 'system',
      direction: 'outbound',
      subject: `Conversation Closed: ${outcome}`,
      content: JSON.stringify(closing),
      intent_classification: 'conversation_close',
    });

  // Update any active sequences
  await supabase
    .from('outreach_sequences')
    .update({
      status: 'completed',
      conversion_achieved: outcome === 'won',
    })
    .eq('lead_id', leadId)
    .eq('status', 'active');

  console.log(`Conversation closed: ${outcome} for ${lead.first_name}`);
  return closing;
}