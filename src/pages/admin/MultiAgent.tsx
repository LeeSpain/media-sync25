import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Brain, Search, Edit, MessageSquare, Calendar, BarChart3, Video, Image } from "lucide-react";

export default function MultiAgent() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newBusiness, setNewBusiness] = useState({
    name: '',
    website_url: '',
    description: '',
    industry: '',
    auto_mode: false,
    languages: ['en']
  });

  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  // Fetch businesses
  const { data: businesses, isLoading: businessesLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch tasks for selected business
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['agent-tasks', selectedBusiness],
    queryFn: async () => {
      if (!selectedBusiness) return [];
      
      const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('business_id', selectedBusiness)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusiness
  });

  // Fetch content queue for selected business
  const { data: contentQueue, isLoading: contentLoading } = useQuery({
    queryKey: ['content-queue', selectedBusiness],
    queryFn: async () => {
      if (!selectedBusiness) return [];
      
      const { data, error } = await supabase
        .from('content_queue')
        .select('*')
        .eq('business_id', selectedBusiness)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBusiness
  });

  // Create business mutation
  const createBusinessMutation = useMutation({
    mutationFn: async (businessData: typeof newBusiness) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('businesses')
        .insert({
          ...businessData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (business) => {
      toast({
        title: "Business Added",
        description: `${business.name} has been added and analysis will begin shortly.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      setNewBusiness({
        name: '',
        website_url: '',
        description: '',
        industry: '',
        auto_mode: false,
        languages: ['en']
      });

      // Initialize the business with Master Agent
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authHeaders = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;

        await supabase.functions.invoke('master-agent', {
          body: {
            businessId: business.id,
            action: 'initialize'
          },
          headers: authHeaders
        });

        toast({
          title: "Analysis Started",
          description: "AI agents are now analyzing your business. Check back in a few minutes."
        });
      } catch (error) {
        console.error('Failed to initialize business:', error);
        toast({
          title: "Analysis Queued",
          description: "Business added successfully. Analysis will start automatically.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Orchestrate agents mutation
  const orchestrateMutation = useMutation({
    mutationFn: async ({ businessId, orchestrationData }: { businessId: string, orchestrationData: any }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const authHeaders = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;

      const { data, error } = await supabase.functions.invoke('master-agent', {
        body: {
          businessId,
          action: 'orchestrate',
          data: orchestrationData
        },
        headers: authHeaders
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Content Creation Started",
        description: "AI agents are creating content for your business."
      });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks', selectedBusiness] });
      queryClient.invalidateQueries({ queryKey: ['content-queue', selectedBusiness] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getAgentIcon = (agentType: string) => {
    const icons = {
      master: Brain,
      research: Search,
      copywriter: Edit,
      image: Image,
      video: Video,
      scheduler: Calendar,
      customer_service: MessageSquare,
      analytics: BarChart3
    };
    const Icon = icons[agentType as keyof typeof icons] || Brain;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      running: 'bg-blue-500',
      completed: 'bg-green-500', 
      failed: 'bg-red-500',
      approved: 'bg-green-500',
      rejected: 'bg-red-500',
      published: 'bg-purple-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Multi-Agent System</h1>
          <p className="text-muted-foreground">AI-powered business content and service automation</p>
        </div>
      </div>

      <Tabs defaultValue="businesses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="agents">Agent Activity</TabsTrigger>
          <TabsTrigger value="content">Content Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-6">
          {/* Add New Business */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Business
              </CardTitle>
              <CardDescription>
                Add a business to start AI-powered content creation and customer service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    value={newBusiness.name}
                    onChange={(e) => setNewBusiness(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ICEOS Lite"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL</Label>
                  <Input
                    id="website-url"
                    value={newBusiness.website_url}
                    onChange={(e) => setNewBusiness(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newBusiness.description}
                  onChange={(e) => setNewBusiness(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the business"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={newBusiness.industry} onValueChange={(value) => setNewBusiness(prev => ({ ...prev, industry: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-mode"
                    checked={newBusiness.auto_mode}
                    onCheckedChange={(checked) => setNewBusiness(prev => ({ ...prev, auto_mode: checked }))}
                  />
                  <Label htmlFor="auto-mode">Auto Mode (Auto-publish content)</Label>
                </div>
              </div>

              <Button 
                onClick={() => createBusinessMutation.mutate(newBusiness)}
                disabled={!newBusiness.name || !newBusiness.website_url || createBusinessMutation.isPending}
                className="w-full"
              >
                {createBusinessMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding Business...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Business & Start Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Businesses */}
          <Card>
            <CardHeader>
              <CardTitle>Your Businesses</CardTitle>
              <CardDescription>Select a business to view agent activity and manage content</CardDescription>
            </CardHeader>
            <CardContent>
              {businessesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : businesses?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No businesses added yet. Add your first business above.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businesses?.map((business) => (
                    <Card 
                      key={business.id} 
                      className={`cursor-pointer transition-colors ${selectedBusiness === business.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedBusiness(business.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{business.name}</h3>
                            <Badge variant={business.auto_mode ? 'default' : 'secondary'}>
                              {business.auto_mode ? 'Auto' : 'Manual'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{business.website_url}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(business.research_status)}>
                              {business.research_status}
                            </Badge>
                            {business.industry && (
                              <Badge variant="outline">{business.industry}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions for Selected Business */}
          {selectedBusiness && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Generate content for the selected business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => orchestrateMutation.mutate({
                      businessId: selectedBusiness,
                      orchestrationData: {
                        contentType: ['post'],
                        platforms: ['twitter', 'linkedin'],
                        autoMode: false
                      }
                    })}
                    disabled={orchestrateMutation.isPending}
                  >
                    {getAgentIcon('copywriter')}
                    <span className="ml-2">Create Social Posts</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => orchestrateMutation.mutate({
                      businessId: selectedBusiness,
                      orchestrationData: {
                        contentType: ['image'],
                        platforms: ['instagram', 'facebook'],
                        autoMode: false
                      }
                    })}
                    disabled={orchestrateMutation.isPending}
                  >
                    {getAgentIcon('image')}
                    <span className="ml-2">Create Images</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => orchestrateMutation.mutate({
                      businessId: selectedBusiness,
                      orchestrationData: {
                        contentType: ['video'],
                        platforms: ['youtube', 'instagram'],
                        autoMode: false
                      }
                    })}
                    disabled={orchestrateMutation.isPending}
                  >
                    {getAgentIcon('video')}
                    <span className="ml-2">Create Videos</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Activity</CardTitle>
              <CardDescription>Real-time view of what your AI agents are working on</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedBusiness ? (
                <p className="text-center text-muted-foreground py-8">
                  Select a business to view agent activity
                </p>
              ) : tasksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tasks?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No agent tasks yet. Use the quick actions to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {tasks?.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getAgentIcon(task.agent_type)}
                        <div>
                          <div className="font-medium capitalize">
                            {task.agent_type.replace('_', ' ')} Agent
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.task_type.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Queue</CardTitle>
              <CardDescription>Review and approve AI-generated content before publishing</CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedBusiness ? (
                <p className="text-center text-muted-foreground py-8">
                  Select a business to view content queue
                </p>
              ) : contentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : contentQueue?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No content in queue. Generate some content using the quick actions.
                </p>
              ) : (
                <div className="space-y-4">
                  {contentQueue?.map((content) => (
                    <Card key={content.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{content.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(content.status)}>
                                {content.status}
                              </Badge>
                              <Badge variant="outline">{content.content_type}</Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {content.content}
                          </p>
                          
                          {content.platforms && content.platforms.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Platforms:</span>
                              {content.platforms.map((platform) => (
                                <Badge key={platform} variant="secondary" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {content.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="default">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive">
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
