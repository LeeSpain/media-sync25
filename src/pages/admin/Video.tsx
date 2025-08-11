import SEO from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VideoManager from "@/components/admin/panels/VideoManager";

const AdminVideo = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : undefined;
  return (
    <main>
      <SEO title="Admin – Video Controls" description="Create, manage, and analyze videos for publishing." canonical={canonical} />
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Video</h1>

      <section className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Video creation & library</CardTitle>
            <CardDescription>Generate branded videos and review performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <VideoManager companyData={{ name: "Workspace" }} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default AdminVideo;
