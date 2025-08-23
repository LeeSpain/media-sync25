import SEO from "@/components/SEO";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const Analytics = () => (
  <main>
    <SEO 
      title="Analytics | Media-Sync" 
      description="Monitor performance, track metrics, and analyze your business data with comprehensive analytics dashboard."
      canonical={window.location.href}
    />
    <AnalyticsDashboard />
  </main>
);

export default Analytics;