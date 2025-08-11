import SEO from "@/components/SEO";
import EmptyState from "@/components/EmptyState";

const Social = () => (
  <main>
    <SEO title="Media-Sync Social Media" description="Compose and schedule posts across accounts." canonical={window.location.href} />
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Social Media</h1>

    <EmptyState
      title="No social posts yet"
      description="Build your audience in CRM, then compose and schedule posts across your accounts."
      actions={[
        { label: "Open CRM", to: "/dashboard/crm", variant: "default" },
        { label: "View Contacts", to: "/dashboard/crm?tab=contacts", variant: "secondary" },
      ]}
    />
  </main>
);

export default Social;
