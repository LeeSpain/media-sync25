import SEO from "@/components/SEO";
import EmptyState from "@/components/EmptyState";

const Messages = () => (
  <main>
    <SEO title="Media-Sync WhatsApp & SMS" description="Inbox and bulk/sequence messaging." canonical={window.location.href} />
    <h1 className="text-2xl md:text-3xl font-bold mb-4">WhatsApp & SMS</h1>

    <EmptyState
      title="No conversations yet"
      description="Import contacts in CRM, then start WhatsApp & SMS outreach and manage replies here."
      actions={[
        { label: "Open CRM", to: "/dashboard/crm", variant: "default" },
        { label: "View Contacts", to: "/dashboard/crm?tab=contacts", variant: "secondary" },
      ]}
    />
  </main>
);

export default Messages;
