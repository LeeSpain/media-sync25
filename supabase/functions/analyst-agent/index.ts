import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalystRequest {
  businessId: string;
  leadId?: string;
  action: 'scoreLead' | 'profileLead' | 'predictOutcome';
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

    const { businessId, leadId, action, data } = await req.json() as AnalystRequest;

    console.log(`Analyst Agent: ${action} for business ${businessId}`);

    // Get business context
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (!business) {
      throw new Error('Business not found');
    }

    let result;
    switch (action) {
      case 'scoreLead':
        result = await scoreLead(supabase, openaiApiKey, leadId!, business);
        break;
      case 'profileLead':
        result = await profileLead(supabase, openaiApiKey, leadId!, business);
        break;
      case 'predictOutcome':
        result = await predictOutcome(supabase, openaiApiKey, leadId!, data);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analyst Agent error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scoreLead(supabase: any, openaiApiKey: string, leadId: string, business: any) {
  console.log('Scoring lead:', leadId);

  // Get lead data
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    throw new Error('Lead not found');
  }

  // AI Lead Scoring
  const scoringPrompt = `
You are an expert lead qualifier for ${business.name} (${business.description}).

Analyze this lead and provide a comprehensive scoring:

LEAD DATA:
- Name: ${lead.first_name} ${lead.last_name}
- Age: ${lead.age || 'Unknown'}
- Location: ${lead.location || 'Unknown'}
- Email: ${lead.email}
- Phone: ${lead.phone || 'Not provided'}
- Occupation: ${lead.occupation || 'Unknown'}
- Income Level: ${lead.income_level || 'Unknown'}

SCORING CRITERIA (1-100 scale):
1. Demographic Fit (age, location relevance)
2. Contact Quality (complete info, professional email)
3. Economic Indicators (income level, occupation)
4. Urgency Indicators (age-related needs)
5. Engagement Potential (social presence, communication channels)

Provide a JSON response with:
{
  "ai_score": 85,
  "qualification_status": "qualified|unqualified|needs_review",
  "demographic_score": 90,
  "contact_quality_score": 80,
  "economic_score": 85,
  "urgency_score": 95,
  "engagement_score": 70,
  "recommendation": "High-value prospect with immediate needs. Prioritize for contact.",
  "risk_factors": ["Limited contact info", "Geographic distance"],
  "strengths": ["Perfect age demographic", "High urgency indicators"]
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
        { role: 'system', content: 'You are an expert lead scoring AI. Always respond with valid JSON.' },
        { role: 'user', content: scoringPrompt }
      ],
      temperature: 0.3,
    }),
  });

  const aiResponse = await response.json();
  let scoring;

  try {
    scoring = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    // Fallback parsing
    const content = aiResponse.choices[0].message.content;
    scoring = {
      ai_score: 50,
      qualification_status: 'needs_review',
      demographic_score: 50,
      contact_quality_score: lead.email ? 70 : 30,
      economic_score: 50,
      urgency_score: 50,
      engagement_score: 50,
      recommendation: content,
    };
  }

  // Update lead with scoring
  await supabase
    .from('leads')
    .update({
      ai_score: scoring.ai_score,
      qualification_status: scoring.qualification_status,
      email_quality_score: scoring.contact_quality_score,
      status: scoring.ai_score >= 70 ? 'qualified' : 'unqualified',
    })
    .eq('id', leadId);

  console.log(`Lead ${leadId} scored: ${scoring.ai_score}/100`);
  return scoring;
}

async function profileLead(supabase: any, openaiApiKey: string, leadId: string, business: any) {
  console.log('Profiling lead:', leadId);

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    throw new Error('Lead not found');
  }

  const profilingPrompt = `
You are a psychographic profiling expert for ${business.name}.

Analyze this lead's psychological and behavioral profile:

LEAD DATA:
- ${lead.first_name} ${lead.last_name}, ${lead.age} years old
- Location: ${lead.location}
- Occupation: ${lead.occupation}
- Contact: ${lead.email}, ${lead.phone}

Based on demographics and context, determine:

1. MOTIVATION TYPE:
   - fear-driven (safety, security concerns)
   - convenience-driven (comfort, ease of use)
   - value-driven (cost savings, practical benefits)
   - status-driven (prestige, social proof)

2. DECISION MAKER TYPE:
   - primary-decision-maker (makes final decisions)
   - influencer (advises but doesn't decide)
   - researcher (gathers information for others)
   - gatekeeper (controls access to decision maker)

3. URGENCY LEVEL:
   - immediate (needs solution now)
   - planned (considering for near future)
   - exploratory (just researching options)

4. PAIN POINTS (specific to our target market):
   - Safety concerns
   - Independence worries
   - Family burden anxiety
   - Technology adoption fears
   - Cost concerns
   - Health-related needs

Provide JSON response:
{
  "motivation_type": "fear-driven",
  "decision_maker_type": "primary-decision-maker",
  "urgency_level": "immediate",
  "pain_points": ["safety concerns", "independence worries"],
  "communication_style": "direct|consultative|educational",
  "preferred_channels": ["email", "phone"],
  "social_proof_needs": "testimonials|certifications|family_approval",
  "messaging_approach": "Detailed explanation of approach"
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
        { role: 'system', content: 'You are a psychographic profiling expert. Always respond with valid JSON.' },
        { role: 'user', content: profilingPrompt }
      ],
      temperature: 0.4,
    }),
  });

  const aiResponse = await response.json();
  let profile;

  try {
    profile = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    profile = {
      motivation_type: 'convenience-driven',
      decision_maker_type: 'primary-decision-maker',
      urgency_level: 'planned',
      pain_points: ['general concerns'],
    };
  }

  // Update lead with profile
  await supabase
    .from('leads')
    .update({
      motivation_type: profile.motivation_type,
      decision_maker_type: profile.decision_maker_type,
      urgency_level: profile.urgency_level,
      pain_points: profile.pain_points,
    })
    .eq('id', leadId);

  console.log(`Lead ${leadId} profiled: ${profile.motivation_type}`);
  return profile;
}

async function predictOutcome(supabase: any, openaiApiKey: string, leadId: string, data: any) {
  console.log('Predicting outcome for lead:', leadId);

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead) {
    throw new Error('Lead not found');
  }

  // Get interaction history
  const { data: interactions } = await supabase
    .from('lead_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  const predictionPrompt = `
You are a predictive analytics AI specializing in sales outcomes.

Analyze this lead's data and interaction history to predict:

LEAD PROFILE:
- Score: ${lead.ai_score}/100
- Status: ${lead.status}
- Motivation: ${lead.motivation_type}
- Urgency: ${lead.urgency_level}
- Decision Type: ${lead.decision_maker_type}

INTERACTION HISTORY:
${interactions?.map(i => `- ${i.channel}: ${i.direction} - ${i.intent_classification}`).join('\n') || 'No interactions yet'}

Predict outcomes with confidence scores:

{
  "lifetime_value_prediction": 850.00,
  "conversion_probability": 0.75,
  "optimal_contact_time": "14:00:00",
  "optimal_contact_day": 3,
  "best_performing_channel": "email",
  "ltv_confidence": 0.80,
  "conversion_confidence": 0.85,
  "timing_confidence": 0.70,
  "predicted_conversion_days": 14,
  "recommended_approach": "Educational nurture sequence focusing on safety benefits"
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
        { role: 'system', content: 'You are a predictive analytics AI. Always respond with valid JSON.' },
        { role: 'user', content: predictionPrompt }
      ],
      temperature: 0.2,
    }),
  });

  const aiResponse = await response.json();
  let predictions;

  try {
    predictions = JSON.parse(aiResponse.choices[0].message.content);
  } catch (e) {
    predictions = {
      lifetime_value_prediction: 500.00,
      conversion_probability: 0.5,
      optimal_contact_time: "10:00:00",
      optimal_contact_day: 2,
      best_performing_channel: "email",
    };
  }

  // Store predictions
  await supabase
    .from('lead_predictions')
    .upsert({
      lead_id: leadId,
      ...predictions,
      model_version: '1.0',
    });

  console.log(`Predictions stored for lead ${leadId}`);
  return predictions;
}