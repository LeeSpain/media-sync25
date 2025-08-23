import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuickCampaignForm from "@/components/email/QuickCampaignForm";
import EmailCampaignManager from "@/components/email/EmailCampaignManager";
import EmailTemplateBuilder from "@/components/email/EmailTemplateBuilder";
import EmailSegmentation from "@/components/email/EmailSegmentation";

const Email = () => (
  <main className="space-y-6">
    <SEO title="Media-Sync Email Marketing" description="Build campaigns with AI copy and A/B tests." canonical={window.location.href} />
    
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Email Marketing</h1>
        <p className="text-muted-foreground">Create, manage, and analyze email campaigns with advanced segmentation and A/B testing</p>
      </div>
    </div>

    <Tabs defaultValue="campaigns" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="audience">Audience</TabsTrigger>
        <TabsTrigger value="quick">Quick Send</TabsTrigger>
      </TabsList>
      
      <TabsContent value="campaigns">
        <EmailCampaignManager />
      </TabsContent>
      
      <TabsContent value="templates">
        <EmailTemplateBuilder />
      </TabsContent>
      
      <TabsContent value="audience">
        <EmailSegmentation />
      </TabsContent>
      
      <TabsContent value="quick">
        <div className="space-y-6">
          <QuickCampaignForm />
        </div>
      </TabsContent>
    </Tabs>
  </main>
);

export default Email;
