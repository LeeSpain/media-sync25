import React from "react";
import SEO from "@/components/SEO";
import EnhancedOnboardingFlow from "@/components/onboarding/EnhancedOnboardingFlow";

export default function Onboarding() {
  return (
    <>
      <SEO 
        title="Welcome to MediaSync - Complete Your Setup"
        description="Set up your AI-powered marketing workspace with our guided onboarding process"
      />
      <EnhancedOnboardingFlow />
    </>
  );
}