import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail,
  Search,
  Filter,
  Plus,
  Send,
  Calendar,
  Eye,
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  PauseCircle,
  Copy,
  Edit,
  Archive,
  MoreHorizontal,
  Target,
  Zap,
  Settings
} from "lucide-react";
import { SkeletonCard, SkeletonList } from "@/components/ui/skeletons";

type EmailCampaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  statistics: any;
  audience_filter: any;
  description: string | null;
  from_address: string | null;
  template_id: string | null;
};

type CampaignStats = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
};

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" }
];

export default function EmailCampaignManager() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [overviewStats, setOverviewStats] = useState({
    total_campaigns: 0,
    active_campaigns: 0,
    total_subscribers: 0,
    avg_open_rate: 0
  });

  useEffect(() => {
    if (user) {
      loadCampaigns();
      loadOverviewStats();
      setupRealTimeUpdates();
    }
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      console.error("Failed to load campaigns:", error);
      toast({
        title: "Failed to load campaigns",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewStats = async () => {
    if (!user) return;

    try {
      // Get campaign counts
      const { data: campaignData } = await supabase
        .from("email_campaigns")
        .select("id, status, statistics")
        .eq("created_by", user.id);

      // Get subscriber count from CRM contacts
      const { data: contactData } = await supabase
        .from("crm_contacts")
        .select("id")
        .eq("created_by", user.id)
        .not("email", "is", null);

      const totalCampaigns = campaignData?.length || 0;
      const activeCampaigns = campaignData?.filter(c => 
        ['scheduled', 'sending', 'sent'].includes(c.status)
      ).length || 0;
      const totalSubscribers = contactData?.length || 0;
      
      // Calculate average open rate
      const campaignsWithStats = campaignData?.filter(c => c.statistics?.sent > 0) || [];
      const avgOpenRate = campaignsWithStats.length > 0 
        ? campaignsWithStats.reduce((acc, c) => acc + (c.statistics?.open_rate || 0), 0) / campaignsWithStats.length
        : 0;

      setOverviewStats({
        total_campaigns: totalCampaigns,
        active_campaigns: activeCampaigns,
        total_subscribers: totalSubscribers,
        avg_open_rate: avgOpenRate
      });
    } catch (error: any) {
      console.error("Failed to load overview stats:", error);
    }
  };

  const setupRealTimeUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel("email-campaigns-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_campaigns",
          filter: `created_by=eq.${user.id}`
        },
        () => {
          loadCampaigns();
          loadOverviewStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchQuery || 
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = async (campaign: EmailCampaign) => {
    try {
      const { error } = await supabase
        .from("email_campaigns")
        .insert({
          name: `Copy of ${campaign.name}`,
          subject: campaign.subject,
          html: "", // Would need to fetch from original
          status: "draft",
          audience_filter: campaign.audience_filter,
          from_address: campaign.from_address,
          template_id: campaign.template_id,
          description: campaign.description,
          created_by: user?.id
        });

      if (error) throw error;
      
      toast({
        title: "Campaign duplicated",
        description: "A copy has been created in your campaigns"
      });
    } catch (error: any) {
      toast({
        title: "Failed to duplicate",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("email_campaigns")
        .update({ status: newStatus })
        .eq("id", campaignId);

      if (error) throw error;
      
      toast({
        title: "Campaign updated",
        description: `Status changed to ${newStatus}`
      });
    } catch (error: any) {
      toast({
        title: "Failed to update campaign",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "sending": return "bg-orange-100 text-orange-800";
      case "scheduled": return "bg-purple-100 text-purple-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStats = (statistics: any): CampaignStats => {
    return {
      sent: statistics?.sent || 0,
      delivered: statistics?.delivered || 0,
      opened: statistics?.opened || 0,
      clicked: statistics?.clicked || 0,
      bounced: statistics?.bounced || 0,
      unsubscribed: statistics?.unsubscribed || 0,
      open_rate: statistics?.open_rate || 0,
      click_rate: statistics?.click_rate || 0,
      bounce_rate: statistics?.bounce_rate || 0
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonList />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{overviewStats.total_campaigns}</p>
              </div>
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{overviewStats.active_campaigns}</p>
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscribers</p>
                <p className="text-2xl font-bold">{overviewStats.total_subscribers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Open Rate</p>
                <p className="text-2xl font-bold">{overviewStats.avg_open_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No campaigns found matching your criteria</p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => {
                const stats = formatStats(campaign.statistics);
                
                return (
                  <Card key={campaign.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-sm line-clamp-2">
                            {campaign.name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {campaign.subject}
                          </p>
                          <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </Badge>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Campaign
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {campaign.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "scheduled")}>
                                <Send className="mr-2 h-4 w-4" />
                                Schedule
                              </DropdownMenuItem>
                            )}
                            {campaign.status === "sending" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, "paused")}>
                                <PauseCircle className="mr-2 h-4 w-4" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(campaign.id, "archived")}
                              className="text-destructive"
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {campaign.description}
                        </p>
                      )}
                      
                      {campaign.scheduled_for && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.scheduled_for).toLocaleString()}
                        </div>
                      )}
                      
                      {stats.sent > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Open Rate</span>
                            <span>{stats.open_rate.toFixed(1)}%</span>
                          </div>
                          <Progress value={stats.open_rate} className="h-2" />
                          
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div className="text-center">
                              <div className="font-medium">{stats.sent}</div>
                              <div>Sent</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{stats.opened}</div>
                              <div>Opened</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{stats.clicked}</div>
                              <div>Clicked</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Campaign</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Recipients</th>
                      <th className="p-4 font-medium">Open Rate</th>
                      <th className="p-4 font-medium">Click Rate</th>
                      <th className="p-4 font-medium">Created</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((campaign) => {
                      const stats = formatStats(campaign.statistics);
                      
                      return (
                        <tr key={campaign.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {campaign.subject}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">
                            {stats.sent || "-"}
                          </td>
                          <td className="p-4 text-sm">
                            {stats.sent > 0 ? `${stats.open_rate.toFixed(1)}%` : "-"}
                          </td>
                          <td className="p-4 text-sm">
                            {stats.sent > 0 ? `${stats.click_rate.toFixed(1)}%` : "-"}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(campaign.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedCampaign(campaign)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(campaign)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Campaign Details Modal */}
      <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCampaign.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Subject Line</h4>
                    <p className="text-muted-foreground">{selectedCampaign.subject}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Badge className={getStatusColor(selectedCampaign.status)}>
                      {selectedCampaign.status}
                    </Badge>
                  </div>
                </div>
                
                {selectedCampaign.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedCampaign.description}</p>
                  </div>
                )}
                
                {selectedCampaign.scheduled_for && (
                  <div>
                    <h4 className="font-medium mb-2">Scheduled For</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(selectedCampaign.scheduled_for).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {selectedCampaign.statistics && (
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(formatStats(selectedCampaign.statistics)).map(([key, value]) => (
                        <div key={key} className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">{value}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {key.replace("_", " ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Campaign
                  </Button>
                  <Button variant="outline" onClick={() => handleDuplicate(selectedCampaign)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}