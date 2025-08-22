import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, MessageSquare, TrendingUp, Zap, Users } from "lucide-react";

const APEX = () => {
  const agents = [
    {
      name: "Analyst Agent",
      icon: Brain,
      description: "AI Lead Scoring & Psychographic Profiling",
      features: ["1-100 Scoring", "Motivation Analysis", "Predictive Analytics"],
      status: "Active"
    },
    {
      name: "Messenger Agent", 
      icon: MessageSquare,
      description: "Omnichannel Outreach & Sequence Automation",
      features: ["Email + LinkedIn + Facebook", "7-Step Sequences", "Hyper-Personalization"],
      status: "Active"
    },
    {
      name: "Listener Agent",
      icon: Users,
      description: "Conversation Intelligence & Response Analysis",
      features: ["Sentiment Analysis", "Intent Classification", "Auto-Response"],
      status: "Active"
    },
    {
      name: "Closer Agent",
      icon: Target,
      description: "Dynamic Offers & Objection Handling",
      features: ["Dynamic Pricing", "Objection Handling", "Conversion Optimization"],
      status: "Active"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">APEX Intelligence Platform</h1>
          <p className="text-muted-foreground">Autonomous Prospect Execution System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const IconComponent = agent.icon;
          return (
            <Card key={agent.name} className="relative">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <IconComponent className="h-6 w-6 text-primary mr-2" />
                <div className="flex-1">
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
                <Badge variant="secondary">{agent.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agent.features.map((feature) => (
                    <div key={feature} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            APEX Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">25%+</div>
              <div className="text-sm text-muted-foreground">Response Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">10%+</div>
              <div className="text-sm text-muted-foreground">Demo Booking</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">€50</div>
              <div className="text-sm text-muted-foreground">Cost per Lead</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Automation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APEX;