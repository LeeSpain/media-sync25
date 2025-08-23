import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Mail,
  Image,
  Type,
  Layout,
  Palette,
  Sparkles,
  ChevronRight,
  Save,
  Send,
  Eye
} from "lucide-react";

const emailTemplates = [
  {
    id: "newsletter",
    name: "Newsletter",
    description: "Weekly updates and company news",
    category: "newsletter",
    preview: "/api/placeholder/300/200",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="color: #333333; margin: 0 0 20px 0;">[COMPANY_NAME] Newsletter</h1>
                    <h2 style="color: #666666; margin: 0 0 30px 0;">[HEADLINE]</h2>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">[CONTENT]</p>
                    <a href="[LINK_URL]" style="display: inline-block; background-color: #007cba; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Read More</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },
  {
    id: "promotion",
    name: "Promotional",
    description: "Product launches and special offers",
    category: "promotional",
    preview: "/api/placeholder/300/200",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Special Offer</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <h1 style="color: #e74c3c; margin: 0 0 20px 0; font-size: 32px;">🎉 Special Offer!</h1>
                    <h2 style="color: #333333; margin: 0 0 30px 0;">[OFFER_TITLE]</h2>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 18px;">[OFFER_DESCRIPTION]</p>
                    <div style="background-color: #ffe6e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="color: #e74c3c; font-size: 24px; font-weight: bold; margin: 0;">Save [DISCOUNT]%</p>
                    </div>
                    <a href="[CTA_LINK]" style="display: inline-block; background-color: #e74c3c; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold;">Shop Now</a>
                    <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">Offer expires [EXPIRY_DATE]</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },
  {
    id: "welcome",
    name: "Welcome Series",
    description: "Onboard new subscribers",
    category: "automation",
    preview: "/api/placeholder/300/200",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0f8ff;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f8ff;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <h1 style="color: #2c3e50; margin: 0 0 20px 0;">Welcome to [COMPANY_NAME]! 👋</h1>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">Hi [FIRST_NAME],</p>
                    <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">We're thrilled to have you join our community! Here's what you can expect:</p>
                    <div style="text-align: left; margin: 20px 0;">
                      <p style="color: #666666; margin: 10px 0;">✅ [BENEFIT_1]</p>
                      <p style="color: #666666; margin: 10px 0;">✅ [BENEFIT_2]</p>
                      <p style="color: #666666; margin: 10px 0;">✅ [BENEFIT_3]</p>
                    </div>
                    <a href="[GET_STARTED_LINK]" style="display: inline-block; background-color: #3498db; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; margin: 20px 0;">Get Started</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }
];

const templateCategories = [
  { value: "all", label: "All Templates" },
  { value: "newsletter", label: "Newsletter" },
  { value: "promotional", label: "Promotional" },
  { value: "automation", label: "Automation" },
  { value: "transactional", label: "Transactional" }
];

export default function EmailTemplateBuilder() {
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState<typeof emailTemplates[0] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [customTemplate, setCustomTemplate] = useState({
    name: "",
    subject: "",
    html: "",
    description: ""
  });
  const [creating, setCreating] = useState(false);

  const filteredTemplates = emailTemplates.filter(template => 
    categoryFilter === "all" || template.category === categoryFilter
  );

  const handleUseTemplate = async (template: typeof emailTemplates[0]) => {
    setSelectedTemplate(template);
    setCustomTemplate({
      name: `Campaign - ${template.name}`,
      subject: `[Subject for ${template.name}]`,
      html: template.html,
      description: template.description
    });
  };

  const handleSaveTemplate = async () => {
    if (!user || !customTemplate.name.trim() || !customTemplate.html.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the template name and HTML content",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from("email_campaigns")
        .insert({
          name: customTemplate.name.trim(),
          subject: customTemplate.subject.trim(),
          html: customTemplate.html,
          description: customTemplate.description.trim() || null,
          status: "draft",
          from_address: "noreply@example.com",
          audience_filter: { segment: "all" },
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Template saved",
        description: "Your email template has been saved as a draft campaign"
      });

      // Reset form
      setCustomTemplate({
        name: "",
        subject: "",
        html: "",
        description: ""
      });
      setSelectedTemplate(null);

    } catch (error: any) {
      toast({
        title: "Failed to save template",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSendTest = async () => {
    if (!user || !customTemplate.html.trim()) {
      toast({
        title: "No content to test",
        description: "Please add HTML content before sending a test",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-email-campaign", {
        body: {
          subject: customTemplate.subject || "Test Email",
          html: customTemplate.html,
          text: null,
          audience: "test",
          from: "test@example.com",
          recipients: [user.email]
        }
      });

      if (error) throw error;

      toast({
        title: "Test email sent",
        description: `Test email sent to ${user.email}`
      });
    } catch (error: any) {
      toast({
        title: "Failed to send test",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Templates</h2>
          <p className="text-muted-foreground">Create and customize email templates for your campaigns</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Custom Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Email Template</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="design" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="html">HTML Code</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="design" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input
                      value={customTemplate.name}
                      onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Custom Template"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                      value={customTemplate.subject}
                      onChange={(e) => setCustomTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Email subject line"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={customTemplate.description}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this template's purpose..."
                    rows={3}
                  />
                </div>
                
                <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                  <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Visual email builder coming soon!</p>
                  <p className="text-sm text-muted-foreground">For now, use the HTML Code tab to create your template</p>
                </div>
              </TabsContent>
              
              <TabsContent value="html" className="space-y-4">
                <div className="space-y-2">
                  <Label>HTML Content</Label>
                  <Textarea
                    value={customTemplate.html}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, html: e.target.value }))}
                    placeholder="Enter your HTML email template here..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2"><strong>Available variables:</strong></p>
                  <div className="grid grid-cols-2 gap-2">
                    <p>[FIRST_NAME] - Recipient's first name</p>
                    <p>[LAST_NAME] - Recipient's last name</p>
                    <p>[EMAIL] - Recipient's email</p>
                    <p>[COMPANY_NAME] - Your company name</p>
                    <p>[UNSUBSCRIBE_LINK] - Unsubscribe link</p>
                    <p>[CURRENT_DATE] - Current date</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="mb-4">
                    <h4 className="font-medium">Subject: {customTemplate.subject || "No subject"}</h4>
                  </div>
                  <div 
                    className="border rounded bg-white p-4 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: customTemplate.html || "<p>No content to preview</p>" }}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} disabled={creating}>
                <Save className="mr-2 h-4 w-4" />
                {creating ? "Saving..." : "Save Template"}
              </Button>
              <Button variant="outline" onClick={handleSendTest}>
                <Send className="mr-2 h-4 w-4" />
                Send Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Template Categories */}
      <div className="flex gap-2">
        {templateCategories.map(category => (
          <Button
            key={category.value}
            variant={categoryFilter === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(category.value)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                >
                  Use Template
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Template Editor */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Customizing: {selectedTemplate.name}</CardTitle>
            <CardDescription>
              Edit the template content and save as a new campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  value={customTemplate.name}
                  onChange={(e) => setCustomTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Campaign name"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={customTemplate.subject}
                  onChange={(e) => setCustomTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>HTML Content</Label>
              <Textarea
                value={customTemplate.html}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, html: e.target.value }))}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} disabled={creating}>
                <Save className="mr-2 h-4 w-4" />
                {creating ? "Saving..." : "Save as Campaign"}
              </Button>
              <Button variant="outline" onClick={handleSendTest}>
                <Send className="mr-2 h-4 w-4" />
                Send Test
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSelectedTemplate(null);
                  setCustomTemplate({ name: "", subject: "", html: "", description: "" });
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}