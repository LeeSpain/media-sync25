
import SEO from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContactsList from "@/components/crm/ContactsList";
import CompaniesList from "@/components/crm/CompaniesList";
import DealsList from "@/components/crm/DealsList";
import CRMProfileSidebar from "@/components/crm/CRMProfileSidebar";
import CRMIntegrations from "@/components/crm/CRMIntegrations";
import ErrorBoundary from "@/components/utility/ErrorBoundary";

const CRM = () => (
  <div className="flex min-h-screen">
    <ErrorBoundary fallback={<div className="flex-1 p-6 text-sm text-destructive">There was an error loading CRM content.</div>}>
      <main className="flex-1 p-6">
        <SEO title="Media-Sync CRM & Sales" description="Track leads, pipeline, and activities." canonical={typeof window !== "undefined" ? window.location.href : undefined} />
        <h1 className="text-2xl md:text-3xl font-bold mb-4">CRM & Sales</h1>

        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="contacts">
            <ContactsList />
          </TabsContent>
          <TabsContent value="companies">
            <CompaniesList />
          </TabsContent>
          <TabsContent value="deals">
            <DealsList />
          </TabsContent>
          <TabsContent value="integrations">
            <CRMIntegrations />
          </TabsContent>
        </Tabs>
      </main>
    </ErrorBoundary>
    <ErrorBoundary fallback={<aside className="w-80 bg-background border-l p-4 text-sm text-destructive">Failed to load sidebar.</aside>}>
      <CRMProfileSidebar />
    </ErrorBoundary>
  </div>
);

export default CRM;
