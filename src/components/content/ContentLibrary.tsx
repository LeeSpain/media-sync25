import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Filter,
  Calendar,
  Share2,
  Download,
  Edit,
  Copy,
  Archive,
  MoreHorizontal,
  Eye,
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Repeat,
  Send,
  Clock,
  CheckCircle2
} from "lucide-react";
import { SkeletonCard, SkeletonList } from "@/components/ui/skeletons";

type ContentItem = {
  id: string;
  title: string | null;
  content: string | null;
  content_type: string;
  platforms: string[];
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  approved_at: string | null;
  created_at: string;
  business_id: string;
  metadata: any;
};

type ContentPerformance = {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagement_rate: number;
};

const contentTypes = [
  { value: "all", label: "All Types" },
  { value: "social_post", label: "Social Media Post" },
  { value: "blog_post", label: "Blog Post" },
  { value: "email", label: "Email" },
  { value: "newsletter", label: "Newsletter" },
  { value: "video", label: "Video Content" },
  { value: "image", label: "Image/Graphics" }
];

const statusFilters = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" }
];

export default function ContentLibrary() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (user) {
      loadContentItems();
      setupRealTimeUpdates();
    }
  }, [user]);

  const loadContentItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("content_queue")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContentItems(data || []);
    } catch (error: any) {
      console.error("Failed to load content items:", error);
      toast({
        title: "Failed to load content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel("content-library-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_queue",
          filter: `created_by=eq.${user.id}`
        },
        () => {
          loadContentItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || item.content_type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDuplicate = async (item: ContentItem) => {
    try {
      const { error } = await supabase
        .from("content_queue")
        .insert({
          title: `Copy of ${item.title || 'Untitled'}`,
          content: item.content,
          content_type: item.content_type,
          platforms: item.platforms,
          status: "draft",
          business_id: item.business_id,
          created_by: user?.id,
          metadata: item.metadata
        });

      if (error) throw error;
      
      toast({
        title: "Content duplicated",
        description: "A copy has been created in your library"
      });
    } catch (error: any) {
      toast({
        title: "Failed to duplicate",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleArchive = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("content_queue")
        .update({ status: "archived" })
        .eq("id", itemId);

      if (error) throw error;
      
      toast({
        title: "Content archived",
        description: "Content moved to archive"
      });
    } catch (error: any) {
      toast({
        title: "Failed to archive",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "approved": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "scheduled": return "bg-purple-100 text-purple-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "archived": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceData = (item: ContentItem): ContentPerformance => {
    // Mock performance data - in real app, this would come from analytics API
    return item.metadata?.performance || {
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 25),
      clicks: Math.floor(Math.random() * 200),
      engagement_rate: parseFloat((Math.random() * 10).toFixed(1))
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
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">{contentItems.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">
                  {contentItems.filter(i => i.status === "published").length}
                </p>
              </div>
              <Send className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">
                  {contentItems.filter(i => i.status === "scheduled").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {contentItems.filter(i => i.status === "pending").length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-yellow-600" />
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
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="published_at">Published Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          {filteredContent.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No content found matching your criteria</p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => {
                const performance = getPerformanceData(item);
                
                return (
                  <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-sm line-clamp-2">
                            {item.title || "Untitled Content"}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {contentTypes.find(t => t.value === item.content_type)?.label}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedContent(item)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleArchive(item.id)}
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
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.content}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {item.platforms.map(platform => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      
                      {item.status === "published" && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {performance.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {performance.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {performance.comments}
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {performance.engagement_rate}%
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Created {new Date(item.created_at).toLocaleDateString()}
                        {item.published_at && (
                          <span> • Published {new Date(item.published_at).toLocaleDateString()}</span>
                        )}
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
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Platforms</th>
                      <th className="p-4 font-medium">Created</th>
                      <th className="p-4 font-medium">Performance</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.map((item) => {
                      const performance = getPerformanceData(item);
                      
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{item.title || "Untitled"}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {item.content}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">
                              {contentTypes.find(t => t.value === item.content_type)?.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(item.status)}>
                              {item.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {item.platforms.slice(0, 2).map(platform => (
                                <Badge key={platform} variant="secondary" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                              {item.platforms.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.platforms.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            {item.status === "published" ? (
                              <div className="flex items-center gap-2 text-sm">
                                <span>{performance.views} views</span>
                                <span>•</span>
                                <span>{performance.engagement_rate}% eng.</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedContent(item)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(item)}>
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
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance Analytics</CardTitle>
              <CardDescription>
                Overview of your content performance across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {contentItems.reduce((acc, item) => {
                      const perf = getPerformanceData(item);
                      return acc + (item.status === "published" ? perf.views : 0);
                    }, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {contentItems.reduce((acc, item) => {
                      const perf = getPerformanceData(item);
                      return acc + (item.status === "published" ? perf.likes : 0);
                    }, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {contentItems.reduce((acc, item) => {
                      const perf = getPerformanceData(item);
                      return acc + (item.status === "published" ? perf.shares : 0);
                    }, 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Shares</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {(contentItems.reduce((acc, item, _, arr) => {
                      const perf = getPerformanceData(item);
                      return acc + (item.status === "published" ? perf.engagement_rate : 0);
                    }, 0) / Math.max(contentItems.filter(i => i.status === "published").length, 1)).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Avg. Engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Details Modal */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedContent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedContent.title || "Untitled Content"}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Content Type</h4>
                    <Badge variant="outline">
                      {contentTypes.find(t => t.value === selectedContent.content_type)?.label}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Badge className={getStatusColor(selectedContent.status)}>
                      {selectedContent.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Content</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedContent.content}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Platforms</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.platforms.map(platform => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedContent.status === "published" && (
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(getPerformanceData(selectedContent)).map(([key, value]) => (
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
                    Edit Content
                  </Button>
                  <Button variant="outline" onClick={() => handleDuplicate(selectedContent)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
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