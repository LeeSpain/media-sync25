import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/components/ui/use-toast";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Send, 
  Calendar,
  RefreshCw,
  Eye,
  Edit3
} from "lucide-react";

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

const contentTypes = [
  { value: "social_post", label: "Social Media Post" },
  { value: "blog_post", label: "Blog Post" },
  { value: "email", label: "Email" },
  { value: "newsletter", label: "Newsletter" }
];

const platforms = [
  { value: "twitter", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "email", label: "Email" }
];

const statusOptions = [
  { value: "pending", label: "Pending Review", icon: Clock, color: "text-yellow-600" },
  { value: "approved", label: "Approved", icon: CheckCircle2, color: "text-green-600" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "text-red-600" },
  { value: "published", label: "Published", icon: Send, color: "text-blue-600" },
  { value: "scheduled", label: "Scheduled", icon: Calendar, color: "text-purple-600" }
];

export default function ContentWorkflowManager() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("social_post");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"]);
  const [scheduledFor, setScheduledFor] = useState("");

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
        .order("created_at", { ascending: false })
        .limit(50);

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
      .channel("content-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "content_queue",
          filter: `created_by=eq.${user.id}`
        },
        (payload) => {
          console.log("Real-time content update:", payload);
          loadContentItems(); // Refresh the list
          
          // Show notifications for status changes
          if (payload.eventType === "UPDATE") {
            const oldRecord = payload.old as ContentItem;
            const newRecord = payload.new as ContentItem;
            
            if (oldRecord.status !== newRecord.status) {
              const statusInfo = statusOptions.find(s => s.value === newRecord.status);
              toast({
                title: "Content status updated",
                description: `"${newRecord.title || 'Untitled'}" is now ${statusInfo?.label || newRecord.status}`
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreate = async () => {
    if (!user || !content.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("content_queue")
        .insert({
          title: title.trim() || null,
          content: content.trim(),
          content_type: contentType,
          platforms: selectedPlatforms,
          status: "pending",
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
          business_id: "00000000-0000-0000-0000-000000000000", // Default business for now
          created_by: user.id,
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;

      setContentItems(prev => [data, ...prev]);
      
      // Reset form
      setTitle("");
      setContent("");
      setContentType("social_post");
      setSelectedPlatforms(["twitter"]);
      setScheduledFor("");

      toast({
        title: "Content created",
        description: "Your content has been added to the queue for review"
      });

    } catch (error: any) {
      console.error("Failed to create content:", error);
      toast({
        title: "Failed to create content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === "approved") {
        updateData.approved_at = new Date().toISOString();
      } else if (newStatus === "published") {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("content_queue")
        .update(updateData)
        .eq("id", itemId);

      if (error) throw error;

      // Auto-publish approved content if it's scheduled for now or past
      if (newStatus === "approved") {
        const item = contentItems.find(i => i.id === itemId);
        if (item && item.scheduled_for && new Date(item.scheduled_for) <= new Date()) {
          handlePublish(itemId);
        }
      }

    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handlePublish = async (itemId: string) => {
    const item = contentItems.find(i => i.id === itemId);
    if (!item) return;

    try {
      // Here you would integrate with actual publishing logic
      // For now, we'll just mark it as published
      await handleStatusChange(itemId, "published");
      
      toast({
        title: "Content published",
        description: `Published to ${item.platforms.join(", ")}`
      });

    } catch (error: any) {
      console.error("Failed to publish:", error);
      toast({
        title: "Failed to publish",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading content...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Content Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Content</CardTitle>
          <CardDescription>
            Add content to the workflow for review and publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter content title..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your content here..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map(platform => (
                  <Button
                    key={platform.value}
                    variant={selectedPlatforms.includes(platform.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedPlatforms(prev => 
                        prev.includes(platform.value)
                          ? prev.filter(p => p !== platform.value)
                          : [...prev, platform.value]
                      );
                    }}
                  >
                    {platform.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Schedule For (optional)</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={creating || !content.trim()}
            className="w-full md:w-auto"
          >
            {creating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Content"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Content Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Content Queue</CardTitle>
          <CardDescription>
            Manage and track your content through the workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contentItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content in queue. Create your first piece of content above.
            </div>
          ) : (
            <div className="space-y-4">
              {contentItems.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">
                          {item.title || "Untitled Content"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{contentTypes.find(t => t.value === item.content_type)?.label}</Badge>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          {item.scheduled_for && (
                            <>
                              <span>•</span>
                              <span>Scheduled: {new Date(item.scheduled_for).toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {item.platforms.map(platform => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platforms.find(p => p.value === platform)?.label || platform}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(item.id, "approved")}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(item.id, "rejected")}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {item.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => handlePublish(item.id)}
                          >
                            <Send className="mr-1 h-4 w-4" />
                            Publish Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Real-time Updates:</strong> This workflow automatically updates when content status changes. 
          Approved content scheduled for the current time will auto-publish.
        </AlertDescription>
      </Alert>
    </div>
  );
}