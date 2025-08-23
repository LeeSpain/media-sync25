import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Wand2, 
  Calendar, 
  Target, 
  Image, 
  Video, 
  FileText, 
  Mail, 
  Plus,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  Send
} from "lucide-react";

const contentTemplates = [
  {
    id: "social_announcement",
    name: "Social Announcement",
    description: "Share news or updates with your audience",
    icon: Send,
    type: "social_post",
    platforms: ["twitter", "linkedin", "facebook"],
    template: "🎉 Exciting news! We're thrilled to announce [ANNOUNCEMENT]. This is a game-changer because [BENEFIT]. Stay tuned for more updates! #exciting #news"
  },
  {
    id: "educational_tip",
    name: "Educational Tip",
    description: "Share valuable knowledge or tips",
    icon: FileText,
    type: "social_post",
    platforms: ["linkedin", "twitter"],
    template: "💡 Pro Tip: [TIP DESCRIPTION]\n\nWhy this matters:\n✓ [BENEFIT 1]\n✓ [BENEFIT 2]\n✓ [BENEFIT 3]\n\nTry it out and let us know how it works for you! #tips #learning"
  },
  {
    id: "behind_scenes",
    name: "Behind the Scenes",
    description: "Show the human side of your brand",
    icon: Image,
    type: "social_post",
    platforms: ["instagram", "facebook", "linkedin"],
    template: "Behind the scenes at [COMPANY]! 👀\n\nToday we're [ACTIVITY]. It's amazing to see [OBSERVATION]. Our team is [EMOTION/ACTION].\n\n#behindthescenes #team #culture"
  },
  {
    id: "product_showcase",
    name: "Product Showcase",
    description: "Highlight features and benefits",
    icon: Target,
    type: "social_post",
    platforms: ["instagram", "facebook", "twitter"],
    template: "Meet [PRODUCT NAME]! ✨\n\n🔥 Key features:\n• [FEATURE 1]\n• [FEATURE 2]\n• [FEATURE 3]\n\nPerfect for [TARGET AUDIENCE] who want [BENEFIT]. \n\nLearn more: [LINK] #product #innovation"
  },
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Weekly/monthly update email",
    icon: Mail,
    type: "email",
    platforms: ["email"],
    template: "Subject: [MONTH] Updates from [COMPANY]\n\nHi [NAME],\n\nHere's what's been happening:\n\n📈 [UPDATE 1]\n🎯 [UPDATE 2]\n💡 [UPDATE 3]\n\nWhat's coming next:\n- [UPCOMING 1]\n- [UPCOMING 2]\n\nThanks for being part of our journey!\n\nBest,\n[YOUR NAME]"
  },
  {
    id: "blog_post",
    name: "Blog Post",
    description: "Long-form content piece",
    icon: FileText,
    type: "blog_post",
    platforms: ["website"],
    template: "# [BLOG TITLE]\n\n## Introduction\n[HOOK STATEMENT]\n\n## The Problem\n[PROBLEM DESCRIPTION]\n\n## Our Solution\n[SOLUTION EXPLANATION]\n\n## Benefits\n1. [BENEFIT 1]\n2. [BENEFIT 2]\n3. [BENEFIT 3]\n\n## Conclusion\n[WRAP UP AND CALL TO ACTION]"
  }
];

const aiPrompts = [
  "Create engaging social media content about [TOPIC]",
  "Write a newsletter announcement for [PRODUCT/SERVICE]",
  "Generate educational content about [INDUSTRY TOPIC]",
  "Create a product showcase post highlighting [FEATURES]",
  "Write behind-the-scenes content about [COMPANY ACTIVITY]",
  "Generate a blog post about [SUBJECT] with actionable tips"
];

const contentTypes = [
  { value: "social_post", label: "Social Media Post", icon: Send },
  { value: "blog_post", label: "Blog Post", icon: FileText },
  { value: "email", label: "Email", icon: Mail },
  { value: "newsletter", label: "Newsletter", icon: Mail },
  { value: "video", label: "Video Content", icon: Video },
  { value: "image", label: "Image/Graphics", icon: Image }
];

const platforms = [
  { value: "twitter", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "email", label: "Email" }
];

export default function ContentCreationWizard() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof contentTemplates[0] | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    content_type: "social_post",
    platforms: ["twitter"],
    scheduled_for: "",
    ai_prompt: ""
  });

  const handleTemplateSelect = (template: typeof contentTemplates[0]) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      content_type: template.type,
      platforms: template.platforms,
      content: template.template
    }));
    setStep(2);
  };

  const handleAIGenerate = async () => {
    if (!formData.ai_prompt.trim()) return;
    
    setCreating(true);
    try {
      // Call AI generation function here
      const response = await supabase.functions.invoke('copywriter-agent', {
        body: { 
          prompt: formData.ai_prompt,
          content_type: formData.content_type,
          platforms: formData.platforms
        }
      });

      if (response.error) throw response.error;
      
      setFormData(prev => ({
        ...prev,
        content: response.data?.content || "Generated content will appear here...",
        title: response.data?.title || ""
      }));
      
      toast({
        title: "Content generated!",
        description: "AI has created your content. Review and edit as needed."
      });
      
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: "Using template instead. " + error.message,
        variant: "destructive"
      });
      
      // Fallback to template
      if (selectedTemplate) {
        setFormData(prev => ({
          ...prev,
          content: selectedTemplate.template
        }));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !formData.content.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("content_queue")
        .insert({
          title: formData.title.trim() || null,
          content: formData.content.trim(),
          content_type: formData.content_type,
          platforms: formData.platforms,
          status: "pending",
          scheduled_for: formData.scheduled_for ? new Date(formData.scheduled_for).toISOString() : null,
          business_id: "00000000-0000-0000-0000-000000000000",
          created_by: user.id,
          metadata: {
            template_used: selectedTemplate?.id,
            ai_generated: !!formData.ai_prompt
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Content created!",
        description: "Your content has been added to the queue for review."
      });

      // Reset form
      setStep(1);
      setSelectedTemplate(null);
      setFormData({
        title: "",
        content: "",
        content_type: "social_post",
        platforms: ["twitter"],
        scheduled_for: "",
        ai_prompt: ""
      });

    } catch (error: any) {
      toast({
        title: "Failed to create content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Content
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Content Creation Wizard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-sm">Choose Method</span>
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm">Create Content</span>
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className="text-sm">Review & Publish</span>
            </div>
          </div>

          {/* Step 1: Choose Method */}
          {step === 1 && (
            <div className="space-y-6">
              <Tabs defaultValue="templates" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="ai">AI Generate</TabsTrigger>
                </TabsList>
                
                <TabsContent value="templates" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <Card 
                          key={template.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{template.name}</CardTitle>
                                <CardDescription className="text-sm">
                                  {template.description}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-1">
                              {template.platforms.map(platform => (
                                <Badge key={platform} variant="secondary" className="text-xs">
                                  {platforms.find(p => p.value === platform)?.label}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="ai" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI Content Generation
                      </CardTitle>
                      <CardDescription>
                        Describe what you want to create and let AI generate content for you
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select 
                          value={formData.content_type} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {contentTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>AI Prompt</Label>
                        <Textarea
                          placeholder="Describe what you want to create..."
                          value={formData.ai_prompt}
                          onChange={(e) => setFormData(prev => ({ ...prev, ai_prompt: e.target.value }))}
                          rows={4}
                        />
                        <div className="text-sm text-muted-foreground">
                          <p className="mb-2">Try these prompts:</p>
                          <div className="flex flex-wrap gap-2">
                            {aiPrompts.map((prompt, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-1 px-2"
                                onClick={() => setFormData(prev => ({ ...prev, ai_prompt: prompt }))}
                              >
                                {prompt}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => {
                          handleAIGenerate();
                          setStep(2);
                        }}
                        disabled={!formData.ai_prompt.trim()}
                        className="w-full"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Start from Scratch
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Create Content */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter content title..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select 
                    value={formData.content_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your content here..."
                  rows={10}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map(platform => (
                      <Button
                        key={platform.value}
                        variant={formData.platforms.includes(platform.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            platforms: prev.platforms.includes(platform.value)
                              ? prev.platforms.filter(p => p !== platform.value)
                              : [...prev.platforms, platform.value]
                          }));
                        }}
                      >
                        {platform.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Schedule For (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_for}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_for: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!formData.content.trim()}>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Publish */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Content</CardTitle>
                  <CardDescription>
                    Double-check everything before adding to your content queue
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Title</h4>
                    <p className="text-muted-foreground">
                      {formData.title || "Untitled Content"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Content Type</h4>
                    <Badge variant="outline">
                      {contentTypes.find(t => t.value === formData.content_type)?.label}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Platforms</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.platforms.map(platform => (
                        <Badge key={platform} variant="secondary">
                          {platforms.find(p => p.value === platform)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Content Preview</h4>
                    <div className="bg-muted p-4 rounded-lg max-h-40 overflow-y-auto">
                      <p className="whitespace-pre-wrap">{formData.content}</p>
                    </div>
                  </div>
                  
                  {formData.scheduled_for && (
                    <div>
                      <h4 className="font-medium mb-2">Scheduled For</h4>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(formData.scheduled_for).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back to Edit
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Add to Queue
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}