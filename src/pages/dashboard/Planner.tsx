import SEO from "@/components/SEO";
import EmptyState from "@/components/EmptyState";

const Planner = () => (
  <main>
    <SEO title="Media-Sync Campaign Planner" description="Plan and schedule multi-channel campaigns." canonical={window.location.href} />
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Campaign Planner</h1>

    <EmptyState
      title="Plan your first campaign"
      description="Add contacts, companies, and deals in CRM, then schedule multi-channel campaigns here."
      actions={[
        { label: "Open CRM", to: "/dashboard/crm", variant: "default" },
        { label: "View Contacts", to: "/dashboard/crm?tab=contacts", variant: "secondary" },
        { label: "View Deals", to: "/dashboard/crm?tab=deals", variant: "outline" },
      ]}
    />
  </main>
);

export default Planner;
