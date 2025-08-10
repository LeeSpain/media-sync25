import { useEffect } from "react";

type SEOProps = {
  title: string;
  description?: string;
  canonical?: string;
  jsonLd?: Record<string, any>;
};

const SEO = ({ title, description, canonical, jsonLd }: SEOProps) => {
  useEffect(() => {
    document.title = title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (description) {
      if (metaDesc) (metaDesc as HTMLMetaElement).setAttribute("content", description);
      else {
        const el = document.createElement("meta");
        el.name = "description";
        el.content = description;
        document.head.appendChild(el);
      }
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    let jsonLdEl = document.getElementById("jsonld") as HTMLScriptElement | null;
    if (jsonLd && Object.keys(jsonLd).length) {
      if (!jsonLdEl) {
        jsonLdEl = document.createElement("script");
        jsonLdEl.type = "application/ld+json";
        jsonLdEl.id = "jsonld";
        document.head.appendChild(jsonLdEl);
      }
      jsonLdEl.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, canonical, jsonLd]);

  return null;
};

export default SEO;
