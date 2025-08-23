import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";

type AnalyticsData = {
  totalAgents: number;
  activeAgents: number;
  totalBusinesses: number;
  totalContacts: number;
  totalDeals: number;
  totalContent: number;
  publishedContent: number;
  pendingContent: number;
  agentPerformance: {
    agent_name: string;
    task_count: number;
    success_rate: number;
  }[];
  contentMetrics: {
    content_type: string;
    total: number;
    published: number;
  }[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: string;
  }[];
};

const MetricCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  isLoading = false 
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<any>;
  trend?: { value: number; label: string };
  isLoading?: boolean;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="h-8 bg-muted animate-pulse rounded" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">
                +{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const PerformanceChart = ({ 
  data, 
  isLoading 
}: { 
  data: AnalyticsData['agentPerformance']; 
  isLoading: boolean 
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Agent Performance</CardTitle>
      <CardDescription>Success rates and task completion by agent</CardDescription>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : data?.length > 0 ? (
        <div className="space-y-4">
          {data.map((agent, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{agent.agent_name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{agent.task_count} tasks</Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(agent.success_rate)}% success
                  </span>
                </div>
              </div>
              <Progress value={agent.success_rate} className="h-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No agent performance data available
        </div>
      )}
    </CardContent>
  </Card>
);

const ActivityFeed = ({ 
  activities, 
  isLoading 
}: { 
  activities: AnalyticsData['recentActivity']; 
  isLoading: boolean 
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Recent Activity</CardTitle>
      <CardDescription>Latest system events and updates</CardDescription>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities?.length > 0 ? (
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity, index) => {
            const Icon = activity.type === 'success' ? CheckCircle : 
                        activity.type === 'warning' ? AlertCircle : 
                        Clock;
            const iconColor = activity.type === 'success' ? 'text-green-600' : 
                             activity.type === 'warning' ? 'text-yellow-600' : 
                             'text-blue-600';
            
            return (
              <div key={index} className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                <div className="space-y-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No recent activity
        </div>
      )}
    </CardContent>
  </Card>
);

export default function AnalyticsDashboard() {
  const { user } = useSupabaseUser();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!user) throw new Error("User not authenticated");

      // Fetch all analytics data in parallel
      const [
        agentsRes,
        businessesRes,
        contactsRes,
        dealsRes,
        contentRes,
        tasksRes
      ] = await Promise.all([
        supabase.from("ai_agents").select("id, name, active").eq("created_by", user.id),
        supabase.from("businesses").select("id").eq("created_by", user.id),
        supabase.from("crm_contacts").select("id").eq("created_by", user.id),
        supabase.from("crm_deals").select("id, status").eq("created_by", user.id),
        supabase.from("content_queue").select("id, status, content_type").eq("created_by", user.id),
        supabase.from("agent_tasks").select("id, agent_type, status, created_at").eq("created_by", user.id)
      ]);

      const agents = agentsRes.data || [];
      const businesses = businessesRes.data || [];
      const contacts = contactsRes.data || [];
      const deals = dealsRes.data || [];
      const content = contentRes.data || [];
      const tasks = tasksRes.data || [];

      // Calculate agent performance
      const agentPerformance = agents.map(agent => {
        const agentTasks = tasks.filter(t => t.agent_type === agent.name.toLowerCase().replace(' ', '-'));
        const completedTasks = agentTasks.filter(t => t.status === 'completed');
        return {
          agent_name: agent.name,
          task_count: agentTasks.length,
          success_rate: agentTasks.length > 0 ? (completedTasks.length / agentTasks.length) * 100 : 0
        };
      });

      // Calculate content metrics
      const contentTypes = ['social_post', 'blog_post', 'email', 'newsletter'];
      const contentMetrics = contentTypes.map(type => {
        const typeContent = content.filter(c => c.content_type === type);
        const published = typeContent.filter(c => c.status === 'published');
        return {
          content_type: type,
          total: typeContent.length,
          published: published.length
        };
      });

      // Generate recent activity (mock data for now)
      const recentActivity = [
        {
          type: 'success',
          description: 'New contact added from LinkedIn campaign',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          type: 'info',
          description: 'Content approved and scheduled for publishing',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          type: 'success',
          description: 'Deal marked as won - $125,000',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
        },
        {
          type: 'warning',
          description: 'Twitter API rate limit approaching',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
        }
      ];

      return {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.active).length,
        totalBusinesses: businesses.length,
        totalContacts: contacts.length,
        totalDeals: deals.length,
        totalContent: content.length,
        publishedContent: content.filter(c => c.status === 'published').length,
        pendingContent: content.filter(c => c.status === 'pending').length,
        agentPerformance,
        contentMetrics,
        recentActivity
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  if (!user) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please sign in to view analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor performance, track metrics, and analyze your business data.
        </p>
      </header>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active AI Agents"
          value={`${analytics?.activeAgents || 0}/${analytics?.totalAgents || 0}`}
          description="Agents currently operational"
          icon={Users}
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Contacts"
          value={analytics?.totalContacts || 0}
          description="CRM contacts managed"
          icon={MessageSquare}
          trend={{ value: 12, label: "this month" }}
          isLoading={isLoading}
        />
        <MetricCard
          title="Open Deals"
          value={analytics?.totalDeals || 0}
          description="Active sales opportunities"
          icon={Target}
          isLoading={isLoading}
        />
        <MetricCard
          title="Content Published"
          value={`${analytics?.publishedContent || 0}/${analytics?.totalContent || 0}`}
          description="Content creation pipeline"
          icon={BarChart3}
          isLoading={isLoading}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart 
          data={analytics?.agentPerformance || []} 
          isLoading={isLoading} 
        />
        <ActivityFeed 
          activities={analytics?.recentActivity || []} 
          isLoading={isLoading} 
        />
      </div>

      {/* Content Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Content Performance</CardTitle>
          <CardDescription>Content creation and publishing statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : analytics?.contentMetrics && analytics.contentMetrics.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {analytics.contentMetrics.map((metric, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{metric.total}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {metric.content_type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {metric.published} published
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No content metrics available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}