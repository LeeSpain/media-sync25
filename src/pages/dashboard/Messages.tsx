import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEO from "@/components/SEO";
import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import MessagesOverview from "@/components/messages/MessagesOverview";

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
};

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [timeRange, setTimeRange] = useState("week");

  return (
    <>
      <SEO 
        title="Customer Messages - AI-Powered Communication Hub"
        description="Manage customer conversations across all platforms with AI-powered response suggestions and real-time messaging"
      />
      
      <div className="h-full">
        <Tabs defaultValue="inbox" className="h-full flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inbox" className="flex-1 flex gap-4 min-h-0">
            {/* Conversation List */}
            <div className="w-80 flex-shrink-0">
              <div className="h-full border rounded-lg bg-card">
                <ConversationList 
                  selectedConversation={selectedConversation}
                  onSelectConversation={setSelectedConversation}
                />
              </div>
            </div>
            
            {/* Message Thread */}
            <div className="flex-1">
              <div className="h-full border rounded-lg bg-card">
                <MessageThread conversation={selectedConversation} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="overview" className="flex-1">
            <MessagesOverview 
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}