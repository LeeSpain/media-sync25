import { Button } from "@/components/ui/button";
import AmbientSpotlight from "@/components/AmbientSpotlight";
import SEO from "@/components/SEO";
import { useI18n } from "@/i18n";

const Index = () => {
  const { t } = useI18n();
  console.log("Index component loaded, t function:", t);
  console.log("Hero title:", t("hero.title"));
  return (
    <>
      <SEO
        title={`${t("hero.title")} | ${t("app.name")}`}
        description="AI-powered in-house marketing & CRM platform with multi-business management, automations, and EN/ES content."
        canonical={window.location.href}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Lovable AI Sales & Marketing",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        }}
      />
      <AmbientSpotlight />
      <main>
        <section className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {t("hero.subtitle")}
            </p>
            <div className="flex items-center justify-center gap-3">
              <a href="/register"><Button variant="hero" size="lg">{t("hero.cta")}</Button></a>
              <a href="#how-it-works"><Button variant="outline" size="lg">{t("hero.secondary")}</Button></a>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="container pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "Onboard", desc: "Add your business, brand and goals in minutes." },
              { title: "Auto-generate", desc: "Strategy, calendar, content and flows across channels." },
              { title: "Optimize", desc: "Track performance, learn, and iterate automatically." },
            ].map((f) => (
              <article key={f.title} className="rounded-lg border bg-card p-6 shadow-soft">
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
