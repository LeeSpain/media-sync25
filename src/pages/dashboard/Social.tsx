import SEO from "@/components/SEO";
import SocialComposer from "@/components/social/SocialComposer";

const Social = () => (
  <main>
    <SEO title="Media-Sync Social Publishing" description="Compose and publish social posts across platforms." canonical={window.location.href} />
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Social Publishing</h1>

    <SocialComposer />
  </main>
);

export default Social;
