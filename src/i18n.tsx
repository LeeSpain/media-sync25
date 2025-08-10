import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "es";

type Dict = Record<string, Record<Lang, string>>;

const dict: Dict = {
  "app.name": { en: "Lovable AI Sales & Marketing", es: "Lovable AI Ventas y Marketing" },
  "nav.onboarding": { en: "Onboarding", es: "Inicio" },
  "nav.dashboard": { en: "Dashboard", es: "Panel" },
  "nav.getStarted": { en: "Get Started", es: "Comenzar" },

  // Landing
  "hero.title": { en: "AI Sales & Marketing Platform", es: "Plataforma de Ventas y Marketing con IA" },
  "hero.subtitle": { en: "Onboard a business, auto-generate strategy, content, and automations across channels in EN/ES.", es: "Incorpora un negocio y genera estrategia, contenido y automatizaciones en todos los canales en EN/ES." },
  "hero.cta": { en: "Build My AI Engine", es: "Crear mi motor IA" },
  "hero.secondary": { en: "See how it works", es: "Ver cómo funciona" },

  // Onboarding steps
  "onboarding.title": { en: "Business Onboarding", es: "Registro del Negocio" },
  "onboarding.step.basic": { en: "Basic Info", es: "Información Básica" },
  "onboarding.step.brand": { en: "Branding", es: "Marca" },
  "onboarding.step.audience": { en: "Target Audience", es: "Público Objetivo" },
  "onboarding.step.goals": { en: "Goals", es: "Objetivos" },
  "onboarding.step.connections": { en: "Connections", es: "Conexiones" },
  "onboarding.step.competitors": { en: "Competitors", es: "Competidores" },
  "onboarding.review": { en: "Review & Finish", es: "Revisar y Finalizar" },

  // Fields
  "field.businessName": { en: "Business Name", es: "Nombre del negocio" },
  "field.description": { en: "Description / Elevator Pitch", es: "Descripción / Pitch" },
  "field.industry": { en: "Industry", es: "Industria" },
  "field.website": { en: "Website URL", es: "Sitio web" },
  "field.location": { en: "Physical Location (optional)", es: "Ubicación física (opcional)" },

  "field.logo": { en: "Logo", es: "Logo" },
  "field.primaryColor": { en: "Primary Color", es: "Color primario" },
  "field.secondaryColor": { en: "Secondary Color", es: "Color secundario" },
  "field.fonts": { en: "Fonts (optional)", es: "Fuentes (opcional)" },
  "field.tone": { en: "Tone of Voice", es: "Tono de voz" },
  "tone.friendly": { en: "Friendly", es: "Amigable" },
  "tone.professional": { en: "Professional", es: "Profesional" },
  "tone.luxury": { en: "Luxury", es: "Lujo" },
  "tone.fun": { en: "Fun", es: "Divertido" },
  "tone.technical": { en: "Technical", es: "Técnico" },

  "field.primaryAudience": { en: "Primary Audience", es: "Público principal" },
  "field.painPoints": { en: "Pain points & needs (list)", es: "Dolores y necesidades (lista)" },
  "field.languages": { en: "Languages", es: "Idiomas" },
  "lang.en": { en: "English", es: "Inglés" },
  "lang.es": { en: "Spanish", es: "Español" },

  "field.goal": { en: "Goal", es: "Objetivo" },
  "goal.leads": { en: "Lead Generation", es: "Generación de leads" },
  "goal.sales": { en: "Sales", es: "Ventas" },
  "goal.awareness": { en: "Awareness", es: "Reconocimiento" },
  "goal.retention": { en: "Retention", es: "Retención" },
  "field.monthlyTarget": { en: "Monthly lead/sales target", es: "Meta mensual de leads/ventas" },

  "field.social": { en: "Social Media", es: "Redes sociales" },
  "field.email": { en: "Email: Inbuilt or SMTP/API", es: "Email: Integrado o SMTP/API" },
  "field.whatsapp": { en: "WhatsApp/SMS: Twilio API", es: "WhatsApp/SMS: API de Twilio" },
  "field.rss": { en: "Blog/Website RSS Feed", es: "RSS del sitio/blog" },

  "field.competitorLinks": { en: "Competitor links (1–3)", es: "Enlaces de competidores (1–3)" },

  // Actions
  "action.next": { en: "Next", es: "Siguiente" },
  "action.back": { en: "Back", es: "Atrás" },
  "action.finish": { en: "Finish", es: "Finalizar" },
  "action.generate": { en: "Generate Plan", es: "Generar plan" },

  // Dashboard
  "dashboard.title": { en: "Workspace", es: "Espacio de trabajo" },
  "dashboard.strategy": { en: "Strategy Plan", es: "Plan de estrategia" },
  "dashboard.calendar": { en: "Campaign Calendar", es: "Calendario de campañas" },
  "dashboard.crm": { en: "CRM & Leads", es: "CRM y Leads" },
  "dashboard.performance": { en: "Performance", es: "Rendimiento" },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) || "en");

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
