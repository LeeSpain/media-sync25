import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/components/ui/use-toast";
import { 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Brain, 
  MessageSquare, 
  Target,
  Sparkles,
  BookOpen,
  Play
} from "lucide-react";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  action?: () => void | Promise<void>;
  href?: string;
};

const OnboardingFlow = () => {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (user) {
      checkOnboardingProgress();
    }
  }, [user]);

  const checkOnboardingProgress = async () => {
    if (!user) return;

    try {
      // Check various completion states
      const [businessRes, agentsRes, contactsRes, contentRes] = await Promise.all([
        supabase.from("businesses").select("id").eq("created_by", user.id).limit(1),
        supabase.from("ai_agents").select("id").eq("created_by", user.id).eq("active", true).limit(1),
        supabase.from("crm_contacts").select("id").eq("created_by", user.id).limit(1),
        supabase.from("content_queue").select("id").eq("created_by", user.id).limit(1)
      ]);

      const hasBusinesses = (businessRes.data?.length || 0) > 0;
      const hasActiveAgents = (agentsRes.data?.length || 0) > 0;
      const hasContacts = (contactsRes.data?.length || 0) > 0;
      const hasContent = (contentRes.data?.length || 0) > 0;

      const onboardingSteps: OnboardingStep[] = [
        {
          id: "welcome",
          title: "Welcome to Media-Sync",
          description: "Get started with your AI-powered business automation platform",
          icon: Sparkles,
          completed: true,
        },
        {
          id: "setup-business",
          title: "Create Your Business Profile",
          description: "Set up your business information for personalized AI assistance",
          icon: Target,
          completed: hasBusinesses,
          action: async () => {
            if (!hasBusinesses) {
              await createSampleBusiness();
            }
          }
        },
        {
          id: "configure-agents",
          title: "Configure AI Agents",
          description: "Activate and customize your AI agents for different tasks",
          icon: Brain,
          completed: hasActiveAgents,
          href: "/admin/sales-ai"
        },
        {
          id: "add-contacts",
          title: "Import Contacts",
          description: "Add your contacts to start building relationships",
          icon: Users,
          completed: hasContacts,
          href: "/dashboard/crm"
        },
        {
          id: "create-content",
          title: "Create First Content",
          description: "Generate your first piece of content for social media",
          icon: MessageSquare,
          completed: hasContent,
          href: "/dashboard/settings?tab=content"
        },
        {
          id: "explore-features",
          title: "Explore Advanced Features",
          description: "Discover analytics, automation, and integrations",
          icon: BookOpen,
          completed: false,
          href: "/dashboard/analytics"
        }
      ];

      setSteps(onboardingSteps);
      
      // Find the first incomplete step
      const firstIncomplete = onboardingSteps.findIndex(step => !step.completed);
      setCurrentStep(firstIncomplete === -1 ? onboardingSteps.length - 1 : firstIncomplete);

    } catch (error) {
      console.error("Failed to check onboarding progress:", error);
    }
  };

  const createSampleBusiness = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .insert({
          name: "My Business",
          description: "Your AI-powered business automation",
          industry: "Technology",
          languages: ["en"],
          auto_mode: false,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Business profile created",
        description: "Your business profile has been set up successfully"
      });

      // Refresh onboarding progress
      await checkOnboardingProgress();

    } catch (error: any) {
      console.error("Failed to create business:", error);
      toast({
        title: "Failed to create business profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepAction = async (step: OnboardingStep) => {
    if (step.action) {
      setLoading(true);
      try {
        await step.action();
      } catch (error) {
        console.error("Step action failed:", error);
      } finally {
        setLoading(false);
      }
    } else if (step.href) {
      window.location.href = step.href;
    }
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
          <CardDescription>
            Complete these steps to unlock the full potential of Media-Sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Progress: {completedSteps}/{totalSteps} steps completed
              </span>
              <Badge variant="outline">
                {Math.round(progressPercentage)}% complete
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {progressPercentage === 100 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Congratulations!</strong> You've completed the onboarding process. 
                You're ready to leverage the full power of AI automation for your business.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCurrent = index === currentStep;
          const isAccessible = step.completed || isCurrent || index < currentStep;

          return (
            <Card 
              key={step.id} 
              className={`transition-all duration-200 ${
                step.completed 
                  ? "border-green-200 bg-green-50/50" 
                  : isCurrent 
                  ? "border-primary bg-primary/5" 
                  : "border-muted"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    step.completed 
                      ? "bg-green-100 text-green-600" 
                      : isCurrent 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{step.title}</h3>
                      {step.completed && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Complete
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {isAccessible && !step.completed && (
                    <Button
                      onClick={() => handleStepAction(step)}
                      disabled={loading}
                      size="sm"
                      className="gap-2"
                    >
                      {step.action ? "Complete" : "Go"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Quick Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>AI Agents:</strong> Each agent specializes in different tasks - Analyst for lead scoring, Messenger for outreach, etc.</p>
            <p><strong>Content Workflow:</strong> Create → Review → Approve → Publish workflow ensures quality content.</p>
            <p><strong>Real-time Updates:</strong> The system automatically syncs changes across all connected platforms.</p>
            <p><strong>Analytics:</strong> Monitor performance and optimize your automation based on data insights.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;