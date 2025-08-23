import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  PlayCircle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  MessageCircle,
  BarChart3,
  Target,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Video,
  Mail,
  Calendar,
  X,
  BookOpen,
  Zap
} from "lucide-react";

type Tutorial = {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  icon: React.ReactNode;
  completed: boolean;
  steps: string[];
};

type InteractiveTutorialsProps = {
  isOpen: boolean;
  onClose: () => void;
};

const tutorials: Tutorial[] = [
  {
    id: "getting-started",
    title: "Getting Started with MediaSync",
    description: "Learn the basics of navigating your AI marketing workspace",
    duration: "5 min",
    category: "Basics",
    difficulty: "beginner",
    icon: <Sparkles className="h-5 w-5" />,
    completed: false,
    steps: [
      "Navigate the dashboard",
      "Understand key metrics",
      "Access main features",
      "Set up your first campaign"
    ]
  },
  {
    id: "content-creation",
    title: "AI Content Creation",
    description: "Create engaging content with AI assistance",
    duration: "8 min",
    category: "Content",
    difficulty: "beginner",
    icon: <FileText className="h-5 w-5" />,
    completed: false,
    steps: [
      "Access content studio",
      "Choose content types",
      "Use AI generation",
      "Review and edit content",
      "Publish or schedule"
    ]
  },
  {
    id: "social-management",
    title: "Social Media Management",
    description: "Schedule and manage social media posts across platforms",
    duration: "10 min",
    category: "Social",
    difficulty: "intermediate",
    icon: <MessageCircle className="h-5 w-5" />,
    completed: false,
    steps: [
      "Connect social accounts",
      "Create social posts",
      "Schedule content",
      "Monitor engagement",
      "Analyze performance"
    ]
  },
  {
    id: "crm-basics",
    title: "CRM & Contact Management",
    description: "Organize and manage your customer relationships",
    duration: "12 min",
    category: "CRM",
    difficulty: "intermediate",
    icon: <Users className="h-5 w-5" />,
    completed: false,
    steps: [
      "Import contacts",
      "Create contact profiles",
      "Manage deals pipeline",
      "Track activities",
      "Generate reports"
    ]
  },
  {
    id: "email-campaigns",
    title: "Email Marketing Campaigns",
    description: "Create and send targeted email campaigns",
    duration: "15 min",
    category: "Email",
    difficulty: "intermediate",
    icon: <Mail className="h-5 w-5" />,
    completed: false,
    steps: [
      "Design email templates",
      "Segment your audience",
      "Set up campaigns",
      "Schedule delivery",
      "Track performance"
    ]
  },
  {
    id: "video-creation",
    title: "Video Content Studio",
    description: "Create professional videos with AI assistance",
    duration: "20 min",
    category: "Video",
    difficulty: "advanced",
    icon: <Video className="h-5 w-5" />,
    completed: false,
    steps: [
      "Access video studio",
      "Choose video templates",
      "Add content and media",
      "Generate voiceovers",
      "Export and share"
    ]
  },
  {
    id: "analytics-insights",
    title: "Analytics & Performance Tracking",
    description: "Understand your marketing performance with detailed analytics",
    duration: "12 min",
    category: "Analytics",
    difficulty: "advanced",
    icon: <BarChart3 className="h-5 w-5" />,
    completed: false,
    steps: [
      "Access analytics dashboard",
      "Understand key metrics",
      "Create custom reports",
      "Set up alerts",
      "Export data"
    ]
  },
  {
    id: "automation-workflows",
    title: "Marketing Automation",
    description: "Set up automated marketing workflows",
    duration: "18 min",
    category: "Automation",
    difficulty: "advanced",
    icon: <Zap className="h-5 w-5" />,
    completed: false,
    steps: [
      "Create automation rules",
      "Set up triggers",
      "Design workflows",
      "Test automations",
      "Monitor performance"
    ]
  }
];

export default function InteractiveTutorials({ isOpen, onClose }: InteractiveTutorialsProps) {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadProgress();
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tutorial_progress")
        .eq("id", user.id)
        .single();

      if (profile?.tutorial_progress && Array.isArray(profile.tutorial_progress)) {
        setCompletedTutorials(profile.tutorial_progress as string[]);
      }
    } catch (error) {
      console.error("Failed to load tutorial progress:", error);
    }
  };

  const saveProgress = async (tutorialId: string) => {
    if (!user) return;

    const newCompleted = [...completedTutorials, tutorialId];
    setCompletedTutorials(newCompleted);

    try {
      await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          tutorial_progress: newCompleted,
          updated_at: new Date().toISOString()
        });

      toast({
        title: "Tutorial completed!",
        description: "Your progress has been saved."
      });
    } catch (error) {
      console.error("Failed to save tutorial progress:", error);
    }
  };

  const startTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
    setCurrentStep(0);
  };

  const completeTutorial = () => {
    if (activeTutorial) {
      saveProgress(activeTutorial.id);
      setActiveTutorial(null);
      setCurrentStep(0);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const categories = ["all", ...Array.from(new Set(tutorials.map(t => t.category)))];
  const filteredTutorials = selectedCategory === "all" 
    ? tutorials 
    : tutorials.filter(t => t.category === selectedCategory);

  const completionRate = Math.round((completedTutorials.length / tutorials.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">Interactive Tutorials</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Learn MediaSync with step-by-step guided tutorials
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {activeTutorial ? (
          /* Tutorial Player */
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{activeTutorial.title}</h3>
                <p className="text-sm text-muted-foreground">{activeTutorial.description}</p>
              </div>
              <Button variant="outline" onClick={() => setActiveTutorial(null)}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Back to Tutorials
              </Button>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Step {currentStep + 1} of {activeTutorial.steps.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(((currentStep + 1) / activeTutorial.steps.length) * 100)}% Complete
                </span>
              </div>
              <Progress value={((currentStep + 1) / activeTutorial.steps.length) * 100} className="h-2" />
            </div>

            <Card className="flex-1">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    {activeTutorial.icon}
                  </div>
                  <h4 className="text-lg font-semibold">
                    {activeTutorial.steps[currentStep]}
                  </h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Follow along with the highlighted elements in your dashboard to complete this step.
                  </p>
                  
                  <div className="mt-8 space-y-3">
                    {activeTutorial.steps.map((step, index) => (
                      <div 
                        key={index} 
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border text-left
                          ${index === currentStep 
                            ? 'bg-primary/10 border-primary' 
                            : index < currentStep 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-muted/50'
                          }
                        `}
                      >
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                          ${index === currentStep 
                            ? 'bg-primary text-white' 
                            : index < currentStep 
                              ? 'bg-green-500 text-white' 
                              : 'bg-muted text-muted-foreground'
                          }
                        `}>
                          {index < currentStep ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className={`
                          ${index === currentStep ? 'font-medium' : ''}
                          ${index < currentStep ? 'text-green-700' : ''}
                        `}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous Step
              </Button>
              
              <div className="flex gap-2">
                {currentStep < activeTutorial.steps.length - 1 ? (
                  <Button onClick={() => setCurrentStep(currentStep + 1)}>
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={completeTutorial} className="bg-green-600 hover:bg-green-700">
                    Complete Tutorial
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Tutorial Library */
          <div className="flex-1 flex flex-col">
            {/* Progress Overview */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Your Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      {completedTutorials.length} of {tutorials.length} tutorials completed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{completionRate}%</div>
                    <Progress value={completionRate} className="w-24 h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                {categories.slice(1).map(category => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTutorials.map((tutorial) => (
                    <Card 
                      key={tutorial.id} 
                      className={`
                        cursor-pointer transition-all hover:shadow-md
                        ${completedTutorials.includes(tutorial.id) 
                          ? 'bg-green-50 border-green-200' 
                          : 'hover:border-primary'
                        }
                      `}
                      onClick={() => startTutorial(tutorial)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`
                            w-12 h-12 rounded-lg flex items-center justify-center
                            ${completedTutorials.includes(tutorial.id)
                              ? 'bg-green-100 text-green-600'
                              : 'bg-primary/10 text-primary'
                            }
                          `}>
                            {completedTutorials.includes(tutorial.id) ? (
                              <CheckCircle className="h-6 w-6" />
                            ) : (
                              tutorial.icon
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{tutorial.title}</h4>
                              {completedTutorials.includes(tutorial.id) && (
                                <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {tutorial.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
                                  {tutorial.difficulty}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {tutorial.duration}
                                </div>
                              </div>
                              
                              <Button size="sm" variant="ghost" className="h-8 px-3">
                                {completedTutorials.includes(tutorial.id) ? (
                                  "Review"
                                ) : (
                                  <>
                                    <PlayCircle className="h-3 w-3 mr-1" />
                                    Start
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}