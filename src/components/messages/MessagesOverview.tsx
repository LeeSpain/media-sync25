import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { 
  MessageCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  AlertCircle,
  Zap,
  Target,
  BarChart3,
  Calendar
} from "lucide-react";

type OverviewStats = {
  totalConversations: number;
  openConversations: number;
  resolvedToday: number;
  avgResponseTime: number;
  satisfactionScore: number;
  platformBreakdown: Record<string, number>;
  responseTimesByHour: Record<string, number>;
  priorityBreakdown: Record<string, number>;
};

type MessagesOverviewProps = {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
};

const timeRangeOptions = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" }, 
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" }
];

export default function MessagesOverview({ timeRange, onTimeRangeChange }: MessagesOverviewProps) {
  const { user } = useSupabaseUser();
  
  const [stats, setStats] = useState<OverviewStats>({
    totalConversations: 0,
    openConversations: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    satisfactionScore: 0,
    platformBreakdown: {},
    responseTimesByHour: {},
    priorityBreakdown: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOverviewStats();
    }
  }, [user, timeRange]);

  const loadOverviewStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get date range based on selection
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "quarter":
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
      }

      // Load conversations
      const { data: conversations } = await supabase
        .from("customer_conversations")
        .select("*")
        .eq("created_by", user.id)
        .gte("created_at", startDate.toISOString());

      // Load messages for response time calculations
      const { data: messages } = await supabase
        .from("customer_messages")
        .select("*")
        .gte("created_at", startDate.toISOString());

      // Calculate stats
      const totalConversations = conversations?.length || 0;
      const openConversations = conversations?.filter(c => c.status === "open").length || 0;
      const resolvedToday = conversations?.filter(c => 
        c.status === "resolved" && 
        new Date(c.updated_at).toDateString() === new Date().toDateString()
      ).length || 0;

      // Platform breakdown
      const platformBreakdown: Record<string, number> = {};
      conversations?.forEach(conv => {
        platformBreakdown[conv.platform] = (platformBreakdown[conv.platform] || 0) + 1;
      });

      // Priority breakdown
      const priorityBreakdown: Record<string, number> = {};
      conversations?.forEach(conv => {
        priorityBreakdown[conv.priority] = (priorityBreakdown[conv.priority] || 0) + 1;
      });

      // Mock some additional stats
      const avgResponseTime = Math.floor(Math.random() * 120) + 15; // 15-135 minutes
      const satisfactionScore = Math.floor(Math.random() * 20) + 80; // 80-100%

      // Response times by hour (mock data)
      const responseTimesByHour: Record<string, number> = {};
      for (let i = 9; i <= 17; i++) {
        responseTimesByHour[`${i}:00`] = Math.floor(Math.random() * 60) + 10;
      }

      setStats({
        totalConversations,
        openConversations,
        resolvedToday,
        avgResponseTime,
        satisfactionScore,
        platformBreakdown,
        responseTimesByHour,
        priorityBreakdown
      });
    } catch (error) {
      console.error("Failed to load overview stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPlatformIcon = (platform: string) => {
    const iconMap = {
      email: "📧",
      twitter: "🐦",
      facebook: "📘", 
      instagram: "📷",
      linkedin: "💼",
      website: "🌐"
    };
    return iconMap[platform as keyof typeof iconMap] || "💬";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages Overview</h2>
          <p className="text-muted-foreground">Track your customer communication performance</p>
        </div>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Conversations</p>
                <p className="text-2xl font-bold">{stats.openConversations}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{formatResponseTime(stats.avgResponseTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction Score</p>
                <p className="text-2xl font-bold">{stats.satisfactionScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Platform Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.platformBreakdown).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPlatformIcon(platform)}</span>
                  <span className="font-medium capitalize">{platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ 
                        width: `${(count / stats.totalConversations) * 100}%` 
                      }}
                    />
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(stats.priorityBreakdown).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getPriorityColor(priority)} text-xs`}>
                    {priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ 
                        width: `${(count / stats.totalConversations) * 100}%` 
                      }}
                    />
                  </div>
                  <Badge variant="outline">{count}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.resolvedToday}</p>
              <p className="text-sm text-muted-foreground">Resolved Today</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {Math.round((stats.resolvedToday / (stats.totalConversations || 1)) * 100)}%
              </p>
              <p className="text-sm text-muted-foreground">Resolution Rate</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {stats.avgResponseTime < 60 ? "Fast" : stats.avgResponseTime < 120 ? "Good" : "Slow"}
              </p>
              <p className="text-sm text-muted-foreground">Response Speed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              View Urgent Messages
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Check Overdue Responses
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Team Performance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}