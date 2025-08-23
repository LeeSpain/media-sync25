import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Building,
  Target,
  Users,
  Palette,
  Zap,
  Rocket,
  Sparkles,
  ArrowRight,
  Play
} from "lucide-react";

type OnboardingStep = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  component: React.ReactNode;
};

type BusinessData = {
  name: string;
  industry: string;
  description: string;
  website_url: string;
  target_audience: string;
  goals: string[];
  brand_colors: string;
  tone_of_voice: string;
  content_types: string[];
  languages: string[];
};

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "Retail", "Real Estate",
  "Marketing", "Consulting", "Manufacturing", "Non-profit", "Other"
];

const goals = [
  "Increase brand awareness", "Generate leads", "Drive sales", "Build community",
  "Educate customers", "Improve customer service", "Launch new products"
];

const contentTypes = [
  "Blog posts", "Social media", "Email campaigns", "Videos", "Infographics",
  "Case studies", "Webinars", "Podcasts", "E-books", "White papers"
];

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Other"
];

const toneOptions = [
  "Professional", "Friendly", "Casual", "Authoritative", "Playful", "Inspirational"
];

export default function EnhancedOnboardingFlow() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: "",
    industry: "",
    description: "",
    website_url: "",
    target_audience: "",
    goals: [],
    brand_colors: "",
    tone_of_voice: "",
    content_types: [],
    languages: ["English"]
  });

  // Welcome Step Component
  const WelcomeStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
          Welcome to MediaSync!
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Let's set up your AI-powered marketing workspace in just a few minutes.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="p-4 border rounded-lg">
          <Target className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Smart Content</h3>
          <p className="text-xs text-muted-foreground">AI-generated content tailored to your brand</p>
        </div>
        <div className="p-4 border rounded-lg">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Automation</h3>
          <p className="text-xs text-muted-foreground">Streamline your marketing workflows</p>
        </div>
        <div className="p-4 border rounded-lg">
          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-sm">Multi-Channel</h3>
          <p className="text-xs text-muted-foreground">Reach customers across all platforms</p>
        </div>
      </div>
    </div>
  );

  // Business Info Step
  const BusinessInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Tell us about your business</h3>
        <p className="text-muted-foreground">This helps us personalize your experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            placeholder="Acme Corporation"
            value={businessData.name}
            onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
            className="h-12"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select 
            value={businessData.industry} 
            onValueChange={(value) => setBusinessData(prev => ({ ...prev, industry: value }))}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry.toLowerCase()}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website URL</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://www.example.com"
          value={businessData.website_url}
          onChange={(e) => setBusinessData(prev => ({ ...prev, website_url: e.target.value }))}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Business Description</Label>
        <Textarea
          id="description"
          placeholder="Briefly describe what your business does..."
          value={businessData.description}
          onChange={(e) => setBusinessData(prev => ({ ...prev, description: e.target.value }))}
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  );

  // Goals & Audience Step
  const GoalsAudienceStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Target className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold">What are your marketing goals?</h3>
        <p className="text-muted-foreground">Select all that apply to your business</p>
      </div>

      <div className="space-y-4">
        <Label>Marketing Goals (select multiple)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map(goal => (
            <div key={goal} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id={goal}
                checked={businessData.goals.includes(goal)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setBusinessData(prev => ({ ...prev, goals: [...prev.goals, goal] }));
                  } else {
                    setBusinessData(prev => ({ ...prev, goals: prev.goals.filter(g => g !== goal) }));
                  }
                }}
              />
              <Label htmlFor={goal} className="text-sm cursor-pointer flex-1">
                {goal}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">Target Audience</Label>
        <Textarea
          id="audience"
          placeholder="Describe your ideal customers (e.g., small business owners, tech professionals, young families)..."
          value={businessData.target_audience}
          onChange={(e) => setBusinessData(prev => ({ ...prev, target_audience: e.target.value }))}
          className="min-h-[80px] resize-none"
        />
      </div>
    </div>
  );

  // Brand & Content Step
  const BrandContentStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Palette className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold">Define your brand voice</h3>
        <p className="text-muted-foreground">Help us create content that matches your style</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tone of Voice</Label>
          <Select 
            value={businessData.tone_of_voice} 
            onValueChange={(value) => setBusinessData(prev => ({ ...prev, tone_of_voice: value }))}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map(tone => (
                <SelectItem key={tone} value={tone.toLowerCase()}>
                  {tone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brandColors">Brand Colors (optional)</Label>
          <Input
            id="brandColors"
            placeholder="e.g., Blue, Green, #FF5733"
            value={businessData.brand_colors}
            onChange={(e) => setBusinessData(prev => ({ ...prev, brand_colors: e.target.value }))}
            className="h-12"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Content Types (select multiple)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {contentTypes.map(type => (
            <div key={type} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id={type}
                checked={businessData.content_types.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setBusinessData(prev => ({ ...prev, content_types: [...prev.content_types, type] }));
                  } else {
                    setBusinessData(prev => ({ ...prev, content_types: prev.content_types.filter(t => t !== type) }));
                  }
                }}
              />
              <Label htmlFor={type} className="text-sm cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Languages (select multiple)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {languages.map(lang => (
            <div key={lang} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <Checkbox
                id={lang}
                checked={businessData.languages.includes(lang)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setBusinessData(prev => ({ ...prev, languages: [...prev.languages, lang] }));
                  } else {
                    setBusinessData(prev => ({ ...prev, languages: prev.languages.filter(l => l !== lang) }));
                  }
                }}
              />
              <Label htmlFor={lang} className="text-sm cursor-pointer">
                {lang}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Completion Step
  const CompletionStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-green-600">You're all set!</h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your AI marketing workspace is ready. Let's start creating amazing content!
        </p>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-6 space-y-4 max-w-md mx-auto">
        <h3 className="font-semibold">What's next?</h3>
        <div className="space-y-2 text-sm text-left">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Business profile created</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>AI preferences configured</span>
          </div>
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span>Ready to generate content</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
        <Button 
          onClick={() => navigate('/dashboard/content')}
          className="gap-2 h-12"
        >
          <Play className="h-4 w-4" />
          Create Content
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="gap-2 h-12"
        >
          <ArrowRight className="h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome",
      subtitle: "Let's get started",
      icon: <Sparkles className="h-5 w-5" />,
      component: <WelcomeStep />
    },
    {
      id: "business",
      title: "Business Info",
      subtitle: "Tell us about your company",
      icon: <Building className="h-5 w-5" />,
      component: <BusinessInfoStep />
    },
    {
      id: "goals",
      title: "Goals & Audience",
      subtitle: "Define your objectives",
      icon: <Target className="h-5 w-5" />,
      component: <GoalsAudienceStep />
    },
    {
      id: "brand",
      title: "Brand & Content",
      subtitle: "Customize your voice",
      icon: <Palette className="h-5 w-5" />,
      component: <BrandContentStep />
    },
    {
      id: "complete",
      title: "Complete",
      subtitle: "You're ready!",
      icon: <CheckCircle className="h-5 w-5" />,
      component: <CompletionStep />
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome step
      case 1: return businessData.name.trim() && businessData.industry; // Business info
      case 2: return businessData.goals.length > 0; // Goals
      case 3: return businessData.tone_of_voice && businessData.content_types.length > 0; // Brand
      case 4: return true; // Complete
      default: return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 2) { // Before completion step
      await handleComplete();
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsCompleting(true);
    try {
      // Create business profile
      const { error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: businessData.name,
          industry: businessData.industry,
          description: businessData.description,
          website_url: businessData.website_url || null,
          languages: businessData.languages,
          brand_guidelines: {
            tone_of_voice: businessData.tone_of_voice,
            brand_colors: businessData.brand_colors,
            target_audience: businessData.target_audience,
            goals: businessData.goals,
            content_types: businessData.content_types
          },
          created_by: user.id
        });

      if (businessError) throw businessError;

      // Update user profile to mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      setCurrentStep(currentStep + 1); // Move to completion step
      
      toast({
        title: "Onboarding completed!",
        description: "Your business profile has been created successfully."
      });

    } catch (error: any) {
      console.error("Failed to complete onboarding:", error);
      toast({
        title: "Failed to complete setup",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </div>
              <Badge variant="outline" className="px-3 py-1">
                {Math.round(progress)}% Complete
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center mb-8 overflow-x-auto pb-2">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-max px-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all
                    ${index === currentStep 
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                      : index < currentStep 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 md:mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <p className="text-muted-foreground">{steps[currentStep].subtitle}</p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <div className="min-h-[400px]">
                {steps[currentStep].component}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2 h-12 px-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length - 1 && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isCompleting}
                  className="gap-2 h-12 px-6"
                >
                  {currentStep === steps.length - 2 ? (
                    isCompleting ? (
                      <>Setting up...</>
                    ) : (
                      <>
                        Complete Setup
                        <Rocket className="h-4 w-4" />
                      </>
                    )
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}