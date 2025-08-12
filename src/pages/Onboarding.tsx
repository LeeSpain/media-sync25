import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import SocialConnectionsStatus from "@/components/social/SocialConnectionsStatus";

export type OnboardingData = {
  // Personal details
  personalFirstName: string;
  personalLastName: string;
  personalEmail?: string;
  personalPhone?: string;

  // Business
  name: string;
  description: string;
  industry: string;
  website?: string;
  location?: string;

  // Brand
  logo?: string; // data url preview only for now
  primaryColor?: string;
  secondaryColor?: string;
  fonts?: string;
  tone?: string;

  // Audience
  audience?: string;
  painPoints?: string;
  langs: { en: boolean; es: boolean };

  // Goals
  goal: "leads" | "sales" | "awareness" | "retention";
  monthlyTarget?: number;

  // Connections
  social: string[];
  emailProvider?: string;
  whatsapp?: boolean;
  rss?: string;

  // Competition
  competitors?: string[];
};

const steps = ["profile", "brand_audience", "goals_competitors", "connections_review"] as const;

type StepKey = typeof steps[number];

const Onboarding = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepKey>("profile");
  const [data, setData] = useState<OnboardingData>({
    personalFirstName: "",
    personalLastName: "",
    personalEmail: "",
    personalPhone: "",
    name: "",
    description: "",
    industry: "",
    website: "",
    location: "",
    primaryColor: "#6b46ff",
    secondaryColor: "#10b3ff",
    tone: "friendly",
    langs: { en: true, es: true },
    goal: "leads",
    social: [],
    whatsapp: false,
    competitors: ["", "", ""],
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (user) {
          const { data: row } = await supabase
            .from("onboarding")
            .select("data")
            .eq("user_id", user.id)
            .maybeSingle();
          if (row?.data) {
            setData((prev) => ({ ...prev, ...((row.data ?? {}) as Partial<OnboardingData>) }));
            return;
          }
        }
        const ls = localStorage.getItem("onboardingData");
        if (ls) {
          setData((prev) => ({ ...prev, ...JSON.parse(ls) }));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const canNext = useMemo(() => {
    if (step === "profile") return Boolean(data.name && data.industry && data.personalFirstName);
    return true;
  }, [step, data]);

  const next = () => setStep(steps[Math.min(steps.indexOf(step) + 1, steps.length - 1)]);
  const back = () => setStep(steps[Math.max(steps.indexOf(step) - 1, 0)]);

  const finish = async () => {
    try {
      setIsSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (user) {
        // 1) Save onboarding JSON
        const { error: upsertError } = await supabase
          .from("onboarding")
          .upsert({ user_id: user.id, data }, { onConflict: "user_id" });
        if (upsertError) throw upsertError;

        // 2) Create or reuse CRM company
        const businessName = (data.name || "").trim();
        const website = (data.website || "").trim();
        let companyId: string | null = null;

        if (businessName || website) {
          let existingCompanyId: string | null = null;

          if (businessName) {
            const { data: byName, error: byNameErr } = await supabase
              .from("crm_companies")
              .select("id")
              .eq("created_by", user.id)
              .eq("name", businessName)
              .maybeSingle();
            if (byNameErr) throw byNameErr;
            if (byName?.id) existingCompanyId = byName.id;
          }

          if (!existingCompanyId && website) {
            const { data: byWeb, error: byWebErr } = await supabase
              .from("crm_companies")
              .select("id")
              .eq("created_by", user.id)
              .eq("website", website)
              .maybeSingle();
            if (byWebErr) throw byWebErr;
            if (byWeb?.id) existingCompanyId = byWeb.id;
          }

          if (existingCompanyId) {
            companyId = existingCompanyId;
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from("crm_companies")
              .insert({
                name: businessName || website || "New Company",
                website: website || null,
                industry: data.industry || null,
                description: data.description || null,
                address: data.location || null,
                created_by: user.id,
              })
              .select("id")
              .single();
            if (insertErr) throw insertErr;
            companyId = inserted.id;
          }
        }

        // 3) Create or update primary contact linked to the company
        const email = (data.personalEmail || user.email || "").trim();
        let contactId: string | null = null;

        if (email) {
          const { data: existingContact, error: contactSelErr } = await supabase
            .from("crm_contacts")
            .select("id, company_id")
            .eq("created_by", user.id)
            .eq("email", email)
            .maybeSingle();
          if (contactSelErr) throw contactSelErr;

          if (existingContact?.id) {
            contactId = existingContact.id;
            const updatePayload: any = {
              first_name: data.personalFirstName || null,
              last_name: data.personalLastName || null,
              phone: data.personalPhone || null,
            };
            if (companyId && !existingContact.company_id) {
              updatePayload.company_id = companyId;
            }
            await supabase.from("crm_contacts").update(updatePayload).eq("id", existingContact.id);
          } else {
            const insertPayload: any = {
              created_by: user.id,
              first_name: data.personalFirstName || null,
              last_name: data.personalLastName || null,
              email,
              phone: data.personalPhone || null,
            };
            if (companyId) insertPayload.company_id = companyId;
            const { data: insertedContact, error: insertContactErr } = await supabase
              .from("crm_contacts")
              .insert(insertPayload)
              .select("id")
              .single();
            if (insertContactErr) throw insertContactErr;
            contactId = insertedContact.id;
          }
        } else {
          // If no email, create a contact only if we have at least a name
          if (data.personalFirstName || data.personalLastName) {
            const insertPayload: any = {
              created_by: user.id,
              first_name: data.personalFirstName || null,
              last_name: data.personalLastName || null,
              phone: data.personalPhone || null,
            };
            if (companyId) insertPayload.company_id = companyId;
            await supabase.from("crm_contacts").insert(insertPayload);
          }
        }

        // 4) Add website link (dedup)
        if (companyId && website) {
          const { data: existingLink } = await supabase
            .from("crm_links")
            .select("id")
            .eq("company_id", companyId)
            .eq("link_type", "website")
            .eq("url", website)
            .maybeSingle();

          if (!existingLink) {
            await supabase.from("crm_links").insert({
              link_type: "website",
              label: "Website",
              url: website,
              company_id: companyId,
              created_by: user.id,
              is_primary: true,
            });
          }
        }

        toast.success("Onboarding completed. CRM client created.");
      } else {
        localStorage.setItem("onboardingData", JSON.stringify(data));
        toast.info("Saved locally. Create an account to sync.");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save onboarding. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  const onLogoChange = (file?: File) => {
    if (!file) return setData({ ...data, logo: undefined });
    const reader = new FileReader();
    reader.onload = () => setData({ ...data, logo: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <main className="container py-10">
      <SEO
        title={`${t("onboarding.title")} | ${t("app.name")}`}
        description="Multi-step onboarding to configure your brand, goals, and connections."
        canonical={window.location.href}
      />
      <h1 className="text-3xl font-bold mb-6">{t("onboarding.title")}</h1>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("onboarding.headings.steps")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {steps.map((s) => (
                <li key={s} className={`flex items-center gap-2 ${s === step ? "text-primary" : "text-muted-foreground"}`}>
                  <span className={`size-2 rounded-full ${s === step ? "bg-primary" : "bg-border"}`} />
                  {t(`onboarding.step.${s}` as any)}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 pt-6">
            {step === "profile" && (
              <section className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" value={data.personalFirstName} onChange={(e) => setData({ ...data, personalFirstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" value={data.personalLastName} onChange={(e) => setData({ ...data, personalLastName: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.personalEmail || ""} onChange={(e) => setData({ ...data, personalEmail: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={data.personalPhone || ""} onChange={(e) => setData({ ...data, personalPhone: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t("field.businessName")}</Label>
                  <Input id="name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">{t("field.description")}</Label>
                  <Textarea id="desc" rows={4} value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="industry">{t("field.industry")}</Label>
                    <Input id="industry" value={data.industry} onChange={(e) => setData({ ...data, industry: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">{t("field.website")}</Label>
                    <Input id="website" value={data.website} onChange={(e) => setData({ ...data, website: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t("field.location")}</Label>
                  <Input id="location" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} />
                </div>
              </section>
            )}

            {step === "brand_audience" && (
              <section className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">{t("onboarding.headings.brand")}</h3>
                  <div className="space-y-2">
                    <Label>{t("field.logo")}</Label>
                    <Input type="file" accept="image/*" onChange={(e) => onLogoChange(e.target.files?.[0])} />
                    {data.logo && (
                      <img src={data.logo} alt="Uploaded logo preview" className="h-16 w-auto rounded-md border" />
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("field.primaryColor")}</Label>
                      <Input type="color" value={data.primaryColor} onChange={(e) => setData({ ...data, primaryColor: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("field.secondaryColor")}</Label>
                      <Input type="color" value={data.secondaryColor} onChange={(e) => setData({ ...data, secondaryColor: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("field.fonts")}</Label>
                      <Input placeholder="Inter, Playfair, etc." value={data.fonts} onChange={(e) => setData({ ...data, fonts: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("field.tone")}</Label>
                      <Select value={data.tone} onValueChange={(v) => setData({ ...data, tone: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          {(["friendly", "professional", "luxury", "fun", "technical"] as const).map((k) => (
                            <SelectItem key={k} value={k}>{t((`tone.${k}`) as any)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-semibold">{t("onboarding.headings.audience")}</h3>
                  <div className="space-y-2">
                    <Label>{t("field.primaryAudience")}</Label>
                    <Textarea rows={3} value={data.audience} onChange={(e) => setData({ ...data, audience: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("field.painPoints")}</Label>
                    <Textarea rows={4} value={data.painPoints} onChange={(e) => setData({ ...data, painPoints: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("field.languages")}</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox id="en" checked={data.langs.en} onCheckedChange={(v) => setData({ ...data, langs: { ...data.langs, en: Boolean(v) } })} />
                        <Label htmlFor="en">{t("lang.en")}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="es" checked={data.langs.es} onCheckedChange={(v) => setData({ ...data, langs: { ...data.langs, es: Boolean(v) } })} />
                        <Label htmlFor="es">{t("lang.es")}</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === "goals_competitors" && (
              <section className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">{t("onboarding.headings.goals")}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("field.goal")}</Label>
                      <Select value={data.goal} onValueChange={(v) => setData({ ...data, goal: v as OnboardingData["goal"] })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leads">{t("goal.leads")}</SelectItem>
                          <SelectItem value="sales">{t("goal.sales")}</SelectItem>
                          <SelectItem value="awareness">{t("goal.awareness")}</SelectItem>
                          <SelectItem value="retention">{t("goal.retention")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("field.monthlyTarget")}</Label>
                      <Input type="number" value={data.monthlyTarget ?? ""} onChange={(e) => setData({ ...data, monthlyTarget: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-semibold">{t("onboarding.headings.competitors")}</h3>
                  <div className="space-y-2">
                    <Label>{t("field.competitorLinks")}</Label>
                    <div className="space-y-2">
                      {data.competitors?.map((c, i) => (
                        <Input key={i} placeholder={`https://competitor-${i + 1}.com`} value={c}
                          onChange={(e) => {
                            const arr = [...(data.competitors || [])];
                            arr[i] = e.target.value;
                            setData({ ...data, competitors: arr });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === "connections_review" && (
              <section className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">{t("onboarding.headings.connections")}</h3>
                  <p className="text-sm text-muted-foreground">{t("onboarding.copy.connectLater")}</p>

                  <div className="space-y-2">
                    <Label>{t("field.social")}</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {["Facebook", "Instagram", "LinkedIn", "TikTok", "YouTube"].map((s) => {
                        const checked = data.social.includes(s);
                        return (
                          <button
                            type="button"
                            key={s}
                            className={`rounded-md border px-3 py-2 text-sm ${checked ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
                            onClick={() =>
                              setData({
                                ...data,
                                social: checked ? data.social.filter((x) => x !== s) : [...data.social, s],
                              })
                            }
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("field.email")}</Label>
                    <Input placeholder="SMTP domain or provider (e.g. SendGrid) – configure later" value={data.emailProvider}
                      onChange={(e) => setData({ ...data, emailProvider: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("field.whatsapp")}</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox checked={!!data.whatsapp} onCheckedChange={(v) => setData({ ...data, whatsapp: Boolean(v) })} />
                      <span>Twilio – connect later in Settings</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("field.rss")}</Label>
                    <Input placeholder="https://yoursite.com/rss.xml" value={data.rss} onChange={(e) => setData({ ...data, rss: e.target.value })} />
                  </div>
                </div>

                <SocialConnectionsStatus />

                <div className="space-y-2">
                  <h3 className="text-base font-semibold">{t("onboarding.headings.review")}</h3>
                  <p className="text-sm text-muted-foreground">{t("onboarding.copy.reviewLead")}</p>
                  <pre className="rounded-md border bg-muted/40 p-4 text-xs overflow-auto max-h-[320px]">{JSON.stringify(data, null, 2)}</pre>
                </div>
              </section>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={back} disabled={step === steps[0]}>{t("action.back")}</Button>
              {step !== "connections_review" ? (
                <Button variant="default" onClick={() => canNext ? next() : toast.error(t("common.missingFields"))}>{t("action.next")}</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="hero" onClick={finish} disabled={isSaving}>{t("action.finish")}</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Onboarding;
