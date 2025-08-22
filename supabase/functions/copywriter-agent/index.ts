import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CopywriterAgentRequest {
  businessId: string;
  contentType: 'social_post' | 'blog_post' | 'email' | 'product_description';
  platforms?: string[];
  topic?: string;
  language?: string;
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

    const { businessId, contentType, platforms = [], topic, language = 'en' }: CopywriterAgentRequest = await req.json();
    console.log(`Copywriter Agent: Creating ${contentType} for business ${businessId}`);

    // Get business details and research data
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    const researchData = business.research_data || {};
    const brandGuidelines = business.brand_guidelines || {};

    let content;

    switch (contentType) {
      case 'social_post':
        content = await createSocialPost(openaiKey, business, researchData, brandGuidelines, platforms, topic, language);
        break;
      case 'blog_post':
        content = await createBlogPost(openaiKey, business, researchData, brandGuidelines, topic, language);
        break;
      case 'email':
        content = await createEmail(openaiKey, business, researchData, brandGuidelines, topic, language);
        break;
      case 'product_description':
        content = await createProductDescription(openaiKey, business, researchData, brandGuidelines, topic, language);
        break;
      default:
        throw new Error('Invalid content type');
    }

    // Save content to queue
    const { data: queuedContent, error: queueError } = await supabase
      .from('content_queue')
      .insert({
        business_id: businessId,
        content_type: contentType,
        title: content.title,
        content: content.body,
        platforms: platforms,
        status: business.auto_mode ? 'approved' : 'pending',
        metadata: {
          language,
          topic,
          brand_voice: brandGuidelines,
          generated_at: new Date().toISOString()
        },
        created_by: business.created_by
      })
      .select()
      .single();

    if (queueError) {
      throw new Error('Failed to queue content');
    }

    // Update task status
    await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        output_data: content,
        completed_at: new Date().toISOString()
      })
      .eq('business_id', businessId)
      .eq('agent_type', 'copywriter')
      .eq('status', 'pending');

    return new Response(JSON.stringify({
      success: true,
      message: `${contentType} created successfully`,
      content,
      queueId: queuedContent.id,
      autoMode: business.auto_mode
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in copywriter-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function createSocialPost(
  openaiKey: string, 
  business: any, 
  researchData: any, 
  brandGuidelines: any, 
  platforms: string[], 
  topic: string = '', 
  language: string = 'en'
) {
  const platformSpecs = {
    twitter: { maxLength: 280, hashtags: 2 },
    linkedin: { maxLength: 3000, hashtags: 5 },
    facebook: { maxLength: 2000, hashtags: 3 },
    instagram: { maxLength: 2200, hashtags: 10 }
  };

  const primaryPlatform = platforms[0] || 'twitter';
  const specs = platformSpecs[primaryPlatform as keyof typeof platformSpecs] || platformSpecs.twitter;

  const prompt = `
Create an engaging social media post for ${business.name}.

Business Context:
- Name: ${business.name}
- Industry: ${business.industry || 'General'}
- Description: ${business.description}
- Target Audience: ${researchData.target_audience || 'General audience'}
- Value Proposition: ${researchData.value_proposition || 'Not specified'}

Brand Voice:
- Tone: ${brandGuidelines.tone || 'Professional'}
- Style: ${brandGuidelines.style || 'Conversational'}
- Personality: ${brandGuidelines.personality || 'Helpful and approachable'}

Content Requirements:
- Platform: ${platforms.join(', ')}
- Primary Platform: ${primaryPlatform}
- Max Length: ${specs.maxLength} characters
- Language: ${language}
- Topic: ${topic || 'Business value/service highlight'}
- Include ${specs.hashtags} relevant hashtags

Content Pillars: ${researchData.content_pillars?.join(', ') || 'Industry insights, company updates, customer value'}

Create a post that:
1. Captures attention in the first line
2. Provides value to the audience
3. Matches the brand voice
4. Includes a subtle call-to-action
5. Is optimized for ${primaryPlatform}

Return in JSON format:
{
  "title": "Brief title/theme",
  "body": "The complete post text",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "call_to_action": "The CTA used",
  "character_count": 123,
  "platform_optimized": "${primaryPlatform}"
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a skilled copywriter specializing in social media content that drives engagement and converts.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();
  const contentText = result.choices[0].message.content;

  try {
    return JSON.parse(contentText);
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return {
      title: topic || 'Social Media Post',
      body: contentText,
      hashtags: [],
      call_to_action: 'Engage with us',
      character_count: contentText.length,
      platform_optimized: primaryPlatform
    };
  }
}

async function createBlogPost(
  openaiKey: string, 
  business: any, 
  researchData: any, 
  brandGuidelines: any, 
  topic: string = '', 
  language: string = 'en'
) {
  const prompt = `
Write a comprehensive blog post for ${business.name}.

Business Context:
- Name: ${business.name}
- Industry: ${business.industry}
- Target Audience: ${researchData.target_audience || 'Industry professionals'}
- Expertise Areas: ${researchData.products_services?.join(', ') || 'Business services'}

Brand Voice:
- Tone: ${brandGuidelines.tone || 'Professional'}
- Style: ${brandGuidelines.style || 'Informative'}

Content Requirements:
- Topic: ${topic || 'Industry insights and expertise'}
- Language: ${language}
- Length: 800-1200 words
- Include SEO-friendly structure
- Provide actionable insights

Create a blog post that:
1. Has an attention-grabbing headline
2. Provides genuine value and insights
3. Establishes thought leadership
4. Includes practical takeaways
5. Ends with a relevant CTA

Return in JSON format:
{
  "title": "SEO-optimized headline",
  "body": "Complete blog post content with HTML formatting",
  "excerpt": "Brief summary for previews",
  "meta_description": "SEO meta description",
  "tags": ["tag1", "tag2", "tag3"],
  "word_count": 1000
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert content writer specializing in thought leadership and SEO-optimized blog content.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();
  const contentText = result.choices[0].message.content;

  try {
    return JSON.parse(contentText);
  } catch (parseError) {
    return {
      title: topic || 'Industry Insights',
      body: contentText,
      excerpt: contentText.substring(0, 200) + '...',
      meta_description: `Learn about ${topic || 'industry insights'} from ${business.name}`,
      tags: ['industry', 'insights', 'business'],
      word_count: contentText.split(' ').length
    };
  }
}

async function createEmail(
  openaiKey: string, 
  business: any, 
  researchData: any, 
  brandGuidelines: any, 
  topic: string = '', 
  language: string = 'en'
) {
  const prompt = `
Create an engaging email for ${business.name}.

Business Context:
- Name: ${business.name}
- Industry: ${business.industry}
- Value Proposition: ${researchData.value_proposition}

Brand Voice:
- Tone: ${brandGuidelines.tone || 'Professional'}
- Style: ${brandGuidelines.style || 'Conversational'}

Email Requirements:
- Topic: ${topic || 'Business update or value-driven content'}
- Language: ${language}
- Include compelling subject line
- Clear call-to-action
- Personal and engaging tone

Return in JSON format:
{
  "title": "Email campaign name",
  "subject": "Compelling subject line",
  "body": "Complete email content with HTML formatting",
  "preview_text": "Email preview text",
  "call_to_action": "Primary CTA text"
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an email marketing specialist who creates high-converting email campaigns.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();
  const contentText = result.choices[0].message.content;

  try {
    return JSON.parse(contentText);
  } catch (parseError) {
    return {
      title: topic || 'Email Campaign',
      subject: `Update from ${business.name}`,
      body: contentText,
      preview_text: 'Important update from our team',
      call_to_action: 'Learn More'
    };
  }
}

async function createProductDescription(
  openaiKey: string, 
  business: any, 
  researchData: any, 
  brandGuidelines: any, 
  topic: string = '', 
  language: string = 'en'
) {
  const prompt = `
Create a compelling product/service description for ${business.name}.

Business Context:
- Name: ${business.name}
- Industry: ${business.industry}
- Products/Services: ${researchData.products_services?.join(', ') || 'Not specified'}
- Target Audience: ${researchData.target_audience}
- Competitive Advantages: ${researchData.competitive_advantages?.join(', ') || 'Not specified'}

Brand Voice:
- Tone: ${brandGuidelines.tone || 'Professional'}
- Style: ${brandGuidelines.style || 'Persuasive'}

Content Requirements:
- Product/Service: ${topic || 'Primary offering'}
- Language: ${language}
- Focus on benefits over features
- Include social proof elements
- Clear value proposition

Return in JSON format:
{
  "title": "Product/Service name",
  "body": "Complete description",
  "key_benefits": ["benefit1", "benefit2", "benefit3"],
  "target_customer": "Who this is for",
  "call_to_action": "Primary CTA"
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a conversion copywriter who creates product descriptions that sell.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();
  const contentText = result.choices[0].message.content;

  try {
    return JSON.parse(contentText);
  } catch (parseError) {
    return {
      title: topic || 'Product Description',
      body: contentText,
      key_benefits: ['High quality', 'Great value', 'Reliable service'],
      target_customer: researchData.target_audience || 'Business customers',
      call_to_action: 'Get Started'
    };
  }
}