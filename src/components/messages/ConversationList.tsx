import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Filter,
  MessageCircle,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Pause
} from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeletons";

type Conversation = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  platform: string;
  status: string;
  priority: string;
  last_message_at: string | null;
  created_at: string;
  business_id: string;
  external_id: string | null;
  language: string | null;
  unread_count?: number;
  last_message_preview?: string;
};

type ConversationListProps = {
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
};

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
];

const platformOptions = [
  { value: "all", label: "All Platforms" },
  { value: "email", label: "Email" },
  { value: "twitter", label: "Twitter" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website Chat" }
];

const priorityOptions = [
  { value: "all", label: "All Priority" },
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

export default function ConversationList({ selectedConversation, onSelectConversation }: ConversationListProps) {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealTimeUpdates();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("customer_conversations")
        .select("*")
        .eq("created_by", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      // Add mock unread counts and preview messages
      const enrichedConversations = (data || []).map(conv => ({
        ...conv,
        unread_count: Math.floor(Math.random() * 5),
        last_message_preview: getPreviewMessage(conv.platform)
      }));
      
      setConversations(enrichedConversations);
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
      toast({
        title: "Failed to load conversations",
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
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_conversations",
          filter: `created_by=eq.${user.id}`
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getPreviewMessage = (platform: string): string => {
    const previews = {
      email: "Thank you for your inquiry about our services...",
      twitter: "Just sent you a DM with more details!",
      facebook: "Hi! Thanks for reaching out on Facebook.",
      instagram: "Love your recent post! Quick question...",
      linkedin: "Following up on our previous conversation...",
      website: "Hello! How can we help you today?"
    };
    return previews[platform as keyof typeof previews] || "New message received";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-blue-100 text-blue-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-3 w-3" />;
      case "pending": return <Pause className="h-3 w-3" />;
      case "resolved": return <CheckCircle2 className="h-3 w-3" />;
      case "closed": return <CheckCircle2 className="h-3 w-3" />;
      default: return <MessageCircle className="h-3 w-3" />;
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = !searchQuery || 
      conversation.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.last_message_preview?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || conversation.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || conversation.platform === platformFilter;
    const matchesPriority = priorityFilter === "all" || conversation.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform && matchesPriority;
  });

  if (loading) {
    return <SkeletonCard />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Badge variant="outline">
            {filteredConversations.length} total
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No conversations found</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPlatformFilter("all");
                setPriorityFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-colors border
                  ${selectedConversation?.id === conversation.id 
                    ? 'bg-primary/10 border-primary' 
                    : 'hover:bg-muted/50 border-transparent'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs">
                      {conversation.customer_name 
                        ? conversation.customer_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : getPlatformIcon(conversation.platform)
                      }
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {conversation.customer_name || conversation.customer_email || "Unknown User"}
                      </h4>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 px-1.5">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {conversation.last_message_preview}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(conversation.status)}`}>
                          {getStatusIcon(conversation.status)}
                          <span className="ml-1">{conversation.status}</span>
                        </Badge>
                        
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                          {conversation.priority}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
                          {getPlatformIcon(conversation.platform)} {conversation.platform}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {conversation.last_message_at 
                          ? new Date(conversation.last_message_at).toLocaleDateString()
                          : new Date(conversation.created_at).toLocaleDateString()
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}