import SEO from "@/components/SEO";
import ContentLibrary from "@/components/content/ContentLibrary";
import ContentCreationWizard from "@/components/content/ContentCreationWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Content = () => (
  <main className="space-y-6">
    <SEO title="Media-Sync Content Library" description="Manage and repurpose your content assets." canonical={window.location.href} />
    
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Content Library</h1>
        <p className="text-muted-foreground">Create, manage, and analyze your content across all platforms</p>
      </div>
      <ContentCreationWizard />
    </div>

    <ContentLibrary />
  </main>
);

export default Content;
