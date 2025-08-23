import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceRequest {
  businessId?: string;
  timeRange?: 'day' | 'week' | 'month' | 'quarter';
  metrics?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { businessId, timeRange = 'week', metrics = [] } = await req.json() as PerformanceRequest;

    console.log(`Performance Analytics: ${timeRange} range for business ${businessId || 'all'}`);

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    // Fetch performance data
    const [agentTasks, contentMetrics, businessData, socialMetrics] = await Promise.all([
      // Agent task performance
      supabase
        .from('agent_tasks')
        .select('id, agent_type, status, created_at, completed_at, error_message')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
      
      // Content performance
      supabase
        .from('content_queue')
        .select('id, content_type, status, created_at, published_at, platforms')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
      
      // Business growth metrics
      supabase
        .from('businesses')
        .select('id, name, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Social publishing metrics
      supabase
        .from('publish_jobs')
        .select('id, provider, status, created_at, response')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
    ]);

    // Process agent performance
    const agentPerformance = {};
    (agentTasks.data || []).forEach(task => {
      const agentType = task.agent_type || 'unknown';
      if (!agentPerformance[agentType]) {
        agentPerformance[agentType] = {
          total: 0,
          completed: 0,
          failed: 0,
          avgCompletionTime: 0,
          totalCompletionTime: 0
        };
      }
      
      agentPerformance[agentType].total++;
      
      if (task.status === 'completed') {
        agentPerformance[agentType].completed++;
        if (task.completed_at) {
          const completionTime = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
          agentPerformance[agentType].totalCompletionTime += completionTime;
        }
      } else if (task.status === 'failed') {
        agentPerformance[agentType].failed++;
      }
    });

    // Calculate averages
    Object.keys(agentPerformance).forEach(agentType => {
      const agent = agentPerformance[agentType];
      if (agent.completed > 0) {
        agent.avgCompletionTime = agent.totalCompletionTime / agent.completed;
      }
      agent.successRate = agent.total > 0 ? (agent.completed / agent.total) * 100 : 0;
    });

    // Process content performance
    const contentPerformance = {
      totalCreated: contentMetrics.data?.length || 0,
      published: (contentMetrics.data || []).filter(c => c.status === 'published').length,
      pending: (contentMetrics.data || []).filter(c => c.status === 'pending').length,
      approved: (contentMetrics.data || []).filter(c => c.status === 'approved').length,
      byType: {}
    };

    (contentMetrics.data || []).forEach(content => {
      const type = content.content_type || 'unknown';
      if (!contentPerformance.byType[type]) {
        contentPerformance.byType[type] = { total: 0, published: 0 };
      }
      contentPerformance.byType[type].total++;
      if (content.status === 'published') {
        contentPerformance.byType[type].published++;
      }
    });

    // Process social metrics
    const socialPerformance = {
      totalJobs: socialMetrics.data?.length || 0,
      successful: (socialMetrics.data || []).filter(j => j.status === 'completed').length,
      failed: (socialMetrics.data || []).filter(j => j.status === 'failed').length,
      byProvider: {}
    };

    (socialMetrics.data || []).forEach(job => {
      const provider = job.provider || 'unknown';
      if (!socialPerformance.byProvider[provider]) {
        socialPerformance.byProvider[provider] = { total: 0, successful: 0, failed: 0 };
      }
      socialPerformance.byProvider[provider].total++;
      if (job.status === 'completed') {
        socialPerformance.byProvider[provider].successful++;
      } else if (job.status === 'failed') {
        socialPerformance.byProvider[provider].failed++;
      }
    });

    // Generate performance insights
    const insights = [];
    
    // Agent insights
    const topPerformingAgent = Object.entries(agentPerformance)
      .sort(([,a], [,b]) => b.successRate - a.successRate)[0];
    
    if (topPerformingAgent) {
      insights.push({
        type: 'agent_performance',
        message: `${topPerformingAgent[0]} agent has the highest success rate at ${topPerformingAgent[1].successRate.toFixed(1)}%`,
        metric: topPerformingAgent[1].successRate
      });
    }

    // Content insights
    if (contentPerformance.totalCreated > 0) {
      const publishRate = (contentPerformance.published / contentPerformance.totalCreated) * 100;
      insights.push({
        type: 'content_performance',
        message: `${publishRate.toFixed(1)}% of content created this ${timeRange} was published`,
        metric: publishRate
      });
    }

    // Social insights
    if (socialPerformance.totalJobs > 0) {
      const socialSuccessRate = (socialPerformance.successful / socialPerformance.totalJobs) * 100;
      insights.push({
        type: 'social_performance',
        message: `${socialSuccessRate.toFixed(1)}% of social posts were published successfully`,
        metric: socialSuccessRate
      });
    }

    const result = {
      success: true,
      timeRange,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      metrics: {
        agentPerformance,
        contentPerformance,
        socialPerformance,
        businessGrowth: {
          newBusinesses: businessData.data?.length || 0
        }
      },
      insights,
      summary: {
        totalTasks: agentTasks.data?.length || 0,
        totalContent: contentMetrics.data?.length || 0,
        totalSocialJobs: socialMetrics.data?.length || 0,
        overallSuccessRate: agentTasks.data?.length > 0 
          ? ((agentTasks.data.filter(t => t.status === 'completed').length / agentTasks.data.length) * 100)
          : 0
      }
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    
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