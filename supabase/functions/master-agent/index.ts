import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MasterAgentRequest {
  businessId: string;
  action: 'initialize' | 'orchestrate' | 'status';
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { businessId, action, data }: MasterAgentRequest = await req.json();
    console.log(`Master Agent: ${action} for business ${businessId}`);

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

    let result;

    switch (action) {
      case 'initialize':
        result = await initializeBusiness(supabase, business, user.id);
        break;
      case 'orchestrate':
        result = await orchestrateAgents(supabase, business, user.id, data);
        break;
      case 'status':
        result = await getStatus(supabase, businessId);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in master-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function initializeBusiness(supabase: any, business: any, userId: string) {
  console.log('Master Agent: Initializing business', business.name);

  // Create initial tasks for all agents
  const tasks = [
    {
      business_id: business.id,
      agent_type: 'research',
      task_type: 'website_analysis',
      input_data: { website_url: business.website_url },
      created_by: userId,
    },
    {
      business_id: business.id,
      agent_type: 'research',
      task_type: 'competitor_analysis',
      input_data: { industry: business.industry },
      created_by: userId,
    },
  ];

  const { error: tasksError } = await supabase
    .from('agent_tasks')
    .insert(tasks);

  if (tasksError) {
    throw new Error('Failed to create initial tasks');
  }

  // Trigger research agent
  try {
    const { data: researchResult } = await supabase.functions.invoke('research-agent', {
      body: {
        businessId: business.id,
        action: 'analyze_website'
      },
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    });
    console.log('Research agent triggered:', researchResult);
  } catch (error) {
    console.warn('Failed to trigger research agent:', error);
  }

  return {
    success: true,
    message: 'Business initialization started',
    tasksCreated: tasks.length
  };
}

async function orchestrateAgents(supabase: any, business: any, userId: string, orchestrationData: any) {
  console.log('Master Agent: Orchestrating agents for', business.name);

  const { contentType, platforms, autoMode } = orchestrationData;

  // Create content creation tasks based on research data
  const tasks = [];

  if (contentType?.includes('post')) {
    tasks.push({
      business_id: business.id,
      agent_type: 'copywriter',
      task_type: 'social_post',
      input_data: { 
        platforms,
        research_data: business.research_data,
        brand_guidelines: business.brand_guidelines
      },
      created_by: userId,
    });
  }

  if (contentType?.includes('image')) {
    tasks.push({
      business_id: business.id,
      agent_type: 'image',
      task_type: 'branded_graphic',
      input_data: { 
        platforms,
        brand_guidelines: business.brand_guidelines
      },
      created_by: userId,
    });
  }

  if (contentType?.includes('video')) {
    tasks.push({
      business_id: business.id,
      agent_type: 'video',
      task_type: 'short_form_video',
      input_data: { 
        platforms,
        brand_guidelines: business.brand_guidelines
      },
      created_by: userId,
    });
  }

  if (tasks.length > 0) {
    const { error: tasksError } = await supabase
      .from('agent_tasks')
      .insert(tasks);

    if (tasksError) {
      throw new Error('Failed to create orchestration tasks');
    }
  }

  // If auto mode is enabled, also create scheduler tasks
  if (autoMode) {
    tasks.push({
      business_id: business.id,
      agent_type: 'scheduler',
      task_type: 'auto_publish',
      input_data: { platforms },
      created_by: userId,
    });
  }

  return {
    success: true,
    message: 'Agent orchestration started',
    tasksCreated: tasks.length,
    autoMode
  };
}

async function getStatus(supabase: any, businessId: string) {
  // Get all active tasks for this business
  const { data: tasks, error: tasksError } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (tasksError) {
    throw new Error('Failed to get task status');
  }

  // Get content queue status
  const { data: contentQueue, error: queueError } = await supabase
    .from('content_queue')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (queueError) {
    throw new Error('Failed to get content queue status');
  }

  const tasksByAgent = tasks.reduce((acc, task) => {
    if (!acc[task.agent_type]) {
      acc[task.agent_type] = {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0
      };
    }
    acc[task.agent_type][task.status]++;
    return acc;
  }, {});

  return {
    success: true,
    tasks: tasksByAgent,
    contentQueue: {
      pending: contentQueue.filter(c => c.status === 'pending').length,
      approved: contentQueue.filter(c => c.status === 'approved').length,
      published: contentQueue.filter(c => c.status === 'published').length,
    },
    recentTasks: tasks.slice(0, 5),
    recentContent: contentQueue.slice(0, 5)
  };
}