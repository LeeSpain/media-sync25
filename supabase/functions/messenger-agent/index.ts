import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessengerRequest {
  businessId: string;
  campaignId?: string;
  leadId?: string;
  action: 'createSequence' | 'executeStep' | 'sendMessage';
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

    const { businessId, campaignId, leadId, action, data } = await req.json() as MessengerRequest;

    console.log(`Messenger Agent: ${action} for business ${businessId}`);

    let result;
    switch (action) {
      case 'createSequence':
        result = await createOutreachSequence(supabase, openaiApiKey, campaignId!, leadId!, businessId);
        break;
      case 'executeStep':
        result = await executeSequenceStep(supabase, openaiApiKey, data.sequenceId);
        break;
      case 'sendMessage':
        result = await sendPersonalizedMessage(supabase, openaiApiKey, leadId!, data);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Messenger Agent error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createOutreachSequence(supabase: any, openaiApiKey: string, campaignId: string, leadId: string, businessId: string) {
  console.log('Creating outreach sequence for lead:', leadId);

  // Get campaign and lead data
  const [campaignResponse, leadResponse, businessResponse] = await Promise.all([
    supabase.from('outreach_campaigns').select('*').eq('id', campaignId).single(),
    supabase.from('leads').select('*').eq('id', leadId).single(),
    supabase.from('businesses').select('*').eq('id', businessId).single()
  ]);

  const campaign = campaignResponse.data;
  const lead = leadResponse.data;
  const business = businessResponse.data;

  if (!campaign || !lead || !business) {
    throw new Error('Missing required data');
  }

  // Generate personalized approach using AI
  const personalizationPrompt = `
You are creating a hyper-personalized outreach strategy for ${business.name}.

LEAD PROFILE:
- ${lead.first_name} ${lead.last_name}, ${lead.age} years old
- Location: ${lead.location}
- Score: ${lead.ai_score}/100
- Motivation: ${lead.motivation_type}
- Urgency: ${lead.urgency_level}
- Pain Points: ${JSON.stringify(lead.pain_points)}

CAMPAIGN: ${campaign.name}
CHANNELS: ${campaign.channels.join(', ')}
SEQUENCE DAYS: ${campaign.sequence_days.join(', ')}

Create a personalized approach that includes:
1. Opening hook specific to their situation
2. Relevant social proof elements
3. Urgency triggers that match their psychology
4. Channel-specific messaging

Respond with JSON:
{
  "personalized_approach": "Margaret, as a retired teacher in Manchester who values being prepared, I wanted to share how other educators in your area have found peace of mind with our solution...",
  "social_proof_elements": [
    {"type": "local_testimonial", "content": "Manchester resident Sarah K. says..."},
    {"type": "profession_match", "content": "Teachers choose us 3:1 over competitors"}
  ],
  "urgency_triggers": [
    {"type": "seasonal", "content": "Winter safety preparation window closing"},
    {"type": "personal", "content": "Independence concerns growing with age"}
  ],
  "channel_strategy": {
    "email": "Educational, professional tone",
    "linkedin": "Peer-to-peer professional connection",
    "facebook": "Community-focused, social proof heavy"
  }
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
        { role: 'system', content: 'You are a hyper-personalization expert. Always respond with valid JSON.' },
        { role: 'user', content: personalizationPrompt }
      ],
      temperature: 0.4,
    }),
  });

  const aiResponse = await response.json();
  let personalization;

  try {
    personalization = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    personalization = {
      personalized_approach: `Hi ${lead.first_name}, I thought you'd be interested in learning about our solution.`,
      social_proof_elements: [],
      urgency_triggers: [],
      channel_strategy: { email: 'Standard approach' }
    };
  }

  // Create outreach sequence
  const { data: sequence } = await supabase
    .from('outreach_sequences')
    .insert({
      campaign_id: campaignId,
      lead_id: leadId,
      max_steps: campaign.sequence_days.length,
      next_contact_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      preferred_channel: campaign.channels[0],
      personalized_approach: personalization.personalized_approach,
      social_proof_elements: personalization.social_proof_elements,
      urgency_triggers: personalization.urgency_triggers,
    })
    .select()
    .single();

  console.log(`Sequence created:`, sequence.id);
  return sequence;
}

async function executeSequenceStep(supabase: any, openaiApiKey: string, sequenceId: string) {
  console.log('Executing sequence step:', sequenceId);

  // Get sequence with related data
  const { data: sequence } = await supabase
    .from('outreach_sequences')
    .select(`
      *,
      outreach_campaigns(*),
      leads(*)
    `)
    .eq('id', sequenceId)
    .single();

  if (!sequence || sequence.status !== 'active') {
    throw new Error('Sequence not found or not active');
  }

  if (sequence.current_step > sequence.max_steps) {
    // Sequence completed
    await supabase
      .from('outreach_sequences')
      .update({ status: 'completed' })
      .eq('id', sequenceId);
    
    return { message: 'Sequence completed' };
  }

  const campaign = sequence.outreach_campaigns;
  const lead = sequence.leads;
  const currentDay = campaign.sequence_days[sequence.current_step - 1];

  // Generate step-specific message
  const messagePrompt = `
You are creating Step ${sequence.current_step} of ${sequence.max_steps} in an outreach sequence.

LEAD: ${lead.first_name} ${lead.last_name}
PERSONALIZED APPROACH: ${sequence.personalized_approach}
CURRENT DAY: Day ${currentDay}
CHANNEL: ${sequence.preferred_channel}

Step Guidelines:
- Step 1: Introduction and value proposition
- Step 2-3: Educational content and social proof
- Step 4-5: Address objections and urgency
- Step 6-7: Final offer and last chance

Create a message for this step that includes:
1. Appropriate subject line (for email)
2. Message content
3. Call to action
4. Next step timing

Respond with JSON:
{
  "subject": "Re: Your safety and independence - Step ${sequence.current_step}",
  "content": "Hi ${lead.first_name},\n\nFollowing up on...",
  "call_to_action": "Would you like to schedule a 15-minute call?",
  "next_step_days": 3,
  "message_type": "educational|promotional|urgency"
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
        { role: 'system', content: 'You are an expert email sequence writer. Always respond with valid JSON.' },
        { role: 'user', content: messagePrompt }
      ],
      temperature: 0.5,
    }),
  });

  const aiResponse = await response.json();
  let message;

  try {
    message = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    message = {
      subject: `Follow-up: Step ${sequence.current_step}`,
      content: `Hi ${lead.first_name}, following up on our previous message...`,
      call_to_action: 'Let me know if you have questions',
      next_step_days: 3,
    };
  }

  // Log the interaction
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: lead.id,
      sequence_id: sequenceId,
      channel: sequence.preferred_channel,
      direction: 'outbound',
      subject: message.subject,
      content: message.content,
      intent_classification: 'outreach',
    });

  // Update sequence for next step
  const nextContactDate = new Date(Date.now() + message.next_step_days * 24 * 60 * 60 * 1000);
  
  await supabase
    .from('outreach_sequences')
    .update({
      current_step: sequence.current_step + 1,
      next_contact_date: nextContactDate,
      total_touchpoints: sequence.total_touchpoints + 1,
      channels_used: [...new Set([...sequence.channels_used, sequence.preferred_channel])],
    })
    .eq('id', sequenceId);

  console.log(`Step ${sequence.current_step} executed for sequence ${sequenceId}`);
  return { message, nextContactDate };
}

async function sendPersonalizedMessage(supabase: any, openaiApiKey: string, leadId: string, data: any) {
  console.log('Sending personalized message to lead:', leadId);

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    throw new Error('Lead not found');
  }

  const { channel, messageType, context } = data;

  // Get recent interactions for context
  const { data: recentInteractions } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(5);

  const messagePrompt = `
Create a hyper-personalized ${messageType} message for ${channel}.

LEAD PROFILE:
- ${lead.first_name} ${lead.last_name}, ${lead.age}, ${lead.location}
- Motivation: ${lead.motivation_type}
- Urgency: ${lead.urgency_level}
- Pain Points: ${JSON.stringify(lead.pain_points)}

CONTEXT: ${context || 'General outreach'}

RECENT INTERACTIONS:
${recentInteractions?.map(i => `- ${i.created_at}: ${i.intent_classification}`).join('\n') || 'None'}

Channel-specific requirements:
- Email: Professional, detailed, include subject
- LinkedIn: Conversational, network-focused
- Facebook: Social, community-oriented
- SMS: Brief, urgent, clear CTA

Create message that feels personal and relevant to their specific situation.

JSON Response:
{
  "subject": "For email only",
  "content": "The complete message content",
  "cta": "Clear call to action",
  "personalization_elements": ["age-specific", "location-based", "profession-relevant"],
  "estimated_engagement_score": 85
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
        { role: 'system', content: 'You are a hyper-personalization expert for outreach messaging. Always respond with valid JSON.' },
        { role: 'user', content: messagePrompt }
      ],
      temperature: 0.6,
    }),
  });

  const aiResponse = await response.json();
  let personalizedMessage;

  try {
    personalizedMessage = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    personalizedMessage = {
      subject: `Message for ${lead.first_name}`,
      content: `Hi ${lead.first_name}, I wanted to reach out personally...`,
      cta: 'Let me know if you\'d like to learn more',
    };
  }

  // Log the message
  await supabase
    .from('lead_interactions')
    .insert({
      lead_id: leadId,
      channel: channel,
      direction: 'outbound',
      subject: personalizedMessage.subject,
      content: personalizedMessage.content,
      intent_classification: messageType,
    });

  // Update lead engagement
  await supabase
    .from('leads')
    .update({
      last_engagement: new Date().toISOString(),
      status: 'contacted',
    })
    .eq('id', leadId);

  console.log(`Personalized ${messageType} message sent via ${channel} to ${lead.first_name}`);
  return personalizedMessage;
}