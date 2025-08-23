import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Send,
  MoreHorizontal,
  Clock,
  User,
  Bot,
  Tag,
  Flag,
  CheckCircle2,
  Pause,
  RefreshCw,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender_type: "customer" | "agent" | "system";
  created_at: string;
  ai_suggested_reply?: string | null;
  reply_approved?: boolean | null;
  metadata?: any;
};

type Conversation = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  platform: string;
  status: string;
  priority: string;
  language: string | null;
};

type MessageThreadProps = {
  conversation: Conversation | null;
};

const statusOptions = [
  { value: "open", label: "Open", icon: <Flag className="h-4 w-4" /> },
  { value: "pending", label: "Pending", icon: <Pause className="h-4 w-4" /> },
  { value: "resolved", label: "Resolved", icon: <CheckCircle2 className="h-4 w-4" /> },
  { value: "closed", label: "Closed", icon: <CheckCircle2 className="h-4 w-4" /> }
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

export default function MessageThread({ conversation }: MessageThreadProps) {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      setupRealTimeUpdates();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    if (!conversation || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Add some mock messages if none exist
      if (!data || data.length === 0) {
        const mockMessages: Message[] = [
          {
            id: "1",
            content: `Hello! I'm interested in learning more about your services. Could you please provide some information?`,
            sender_type: "customer",
            created_at: new Date(Date.now() - 120000).toISOString(),
            ai_suggested_reply: "Thank you for your interest! I'd be happy to help you learn more about our services. What specific area would you like to know about?",
            metadata: {}
          },
          {
            id: "2", 
            content: "Thank you for reaching out! I'd be happy to help you learn more about our services. What specific area would you like to know about?",
            sender_type: "agent",
            created_at: new Date(Date.now() - 60000).toISOString(),
            metadata: {}
          }
        ];
        setMessages(mockMessages);
      } else {
        setMessages(data.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender_type: msg.sender_type as "customer" | "agent" | "system",
          created_at: msg.created_at,
          ai_suggested_reply: msg.ai_suggested_reply,
          reply_approved: msg.reply_approved,
          metadata: msg.metadata
        })));
      }
    } catch (error: any) {
      console.error("Failed to load messages:", error);
      toast({
        title: "Failed to load messages",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    if (!conversation) return;

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customer_messages",
          filter: `conversation_id=eq.${conversation.id}`
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("customer_messages")
        .insert({
          conversation_id: conversation.id,
          content: newMessage.trim(),
          sender_type: "agent"
        });

      if (error) throw error;

      // Update conversation status and last message time
      await supabase
        .from("customer_conversations")
        .update({ 
          last_message_at: new Date().toISOString(),
          status: "pending"
        })
        .eq("id", conversation.id);

      setNewMessage("");
      setAiSuggestion("");
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully"
      });
    } catch (error: any) {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const generateAIResponse = async () => {
    if (!conversation || generatingAI) return;

    setGeneratingAI(true);
    try {
      // Mock AI response generation
      const responses = [
        "Thank you for your message! I understand your concern and would be happy to help you resolve this issue.",
        "I appreciate you reaching out. Let me look into this for you and get back with a solution.",
        "Great question! Based on your needs, I'd recommend exploring our premium features that can help with exactly what you're looking for.",
        "I'd be happy to schedule a call to discuss this in more detail. What time works best for you?",
        "Thank you for your patience. I've reviewed your account and can see the issue. Here's what we can do to fix it..."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAiSuggestion(randomResponse);
      
      toast({
        title: "AI response generated",
        description: "Review the suggested response and modify as needed"
      });
    } catch (error: any) {
      toast({
        title: "Failed to generate AI response",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const useAISuggestion = () => {
    setNewMessage(aiSuggestion);
    setAiSuggestion("");
  };

  const updateConversationStatus = async (status: string) => {
    if (!conversation || !user) return;

    try {
      const { error } = await supabase
        .from("customer_conversations")
        .update({ status })
        .eq("id", conversation.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Conversation marked as ${status}`
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateConversationPriority = async (priority: string) => {
    if (!conversation || !user) return;

    try {
      const { error } = await supabase
        .from("customer_conversations")
        .update({ priority })
        .eq("id", conversation.id);

      if (error) throw error;

      toast({
        title: "Priority updated",
        description: `Priority set to ${priority}`
      });
    } catch (error: any) {
      toast({
        title: "Failed to update priority", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
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

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
          <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {conversation.customer_name 
                  ? conversation.customer_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : getPlatformIcon(conversation.platform)
                }
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">
                {conversation.customer_name || conversation.customer_email || "Unknown User"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {getPlatformIcon(conversation.platform)} {conversation.platform}
                {conversation.customer_email && ` • ${conversation.customer_email}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={conversation.status} onValueChange={updateConversationStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={conversation.priority} onValueChange={updateConversationPriority}>
              <SelectTrigger className="w-24">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tags
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] ${message.sender_type === "agent" ? "order-2" : "order-1"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1">
                      {message.sender_type === "customer" ? (
                        <User className="h-3 w-3" />
                      ) : message.sender_type === "agent" ? (
                        <User className="h-3 w-3 text-primary" />
                      ) : (
                        <Bot className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs font-medium">
                        {message.sender_type === "customer" 
                          ? conversation.customer_name || "Customer"
                          : message.sender_type === "agent"
                          ? "You"
                          : "System"
                        }
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.created_at)}
                    </span>
                  </div>
                  
                  <div className={`
                    p-3 rounded-lg
                    ${message.sender_type === "agent" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                    }
                  `}>
                    <p className="text-sm">{message.content}</p>
                  </div>

                  {/* AI Suggestion for customer messages */}
                  {message.sender_type === "customer" && message.ai_suggested_reply && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-blue-600" />
                        <span className="font-medium text-blue-700">AI Suggested Reply:</span>
                      </div>
                      <p className="text-blue-700 mb-2">{message.ai_suggested_reply}</p>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs"
                          onClick={() => setNewMessage(message.ai_suggested_reply || "")}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* AI Suggestion Panel */}
      {aiSuggestion && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700">AI Suggested Response:</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">{aiSuggestion}</p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={useAISuggestion}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Use This Response
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setAiSuggestion("")}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="min-h-[80px] resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={generateAIResponse}
              disabled={generatingAI}
              variant="outline"
              size="sm"
            >
              {generatingAI ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}