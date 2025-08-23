import React from "react";
import SEO from "@/components/SEO";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Overview = () => {
  return (
    <main className="container py-6 space-y-6">
      <SEO 
        title="Dashboard Overview | Media-Sync" 
        description="Your comprehensive business automation dashboard with AI agents, analytics, and onboarding guidance."
        canonical={window.location.href}
      />
      
      <header>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitor your business automation and AI performance at a glance.
        </p>
      </header>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="onboarding">Getting Started</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingFlow />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Overview;