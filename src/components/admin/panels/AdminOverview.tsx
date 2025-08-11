
import CompanyOnboarding from "./CompanyOnboarding";
import ContentCreator from "./ContentCreator";
import ConnectionsPanel from "./ConnectionsPanel";
import RecentClients from "./RecentClients";

export default function AdminOverview() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <RecentClients />
        <CompanyOnboarding />
        <ContentCreator />
        <ConnectionsPanel />
      </div>
    </div>
  );
}
