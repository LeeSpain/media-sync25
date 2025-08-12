import SEO from "@/components/SEO";
import QuickCampaignForm from "@/components/email/QuickCampaignForm";
import EmptyState from "@/components/EmptyState";

const Email = () => (
  <main>
    <SEO title="Media-Sync Email Marketing" description="Build campaigns with AI copy and A/B tests." canonical={window.location.href} />
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Email Marketing</h1>

    <section className="space-y-6">
      <QuickCampaignForm />
      <EmptyState
        title="Start your first email campaign"
        description="Segment contacts in CRM and send targeted campaigns with AI copy and A/B tests."
        actions={[
          { label: "Open CRM", to: "/dashboard/crm", variant: "default" },
          { label: "View Contacts", to: "/dashboard/crm?tab=contacts", variant: "secondary" },
        ]}
      />
    </section>
  </main>
);

export default Email;
