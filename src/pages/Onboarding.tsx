import { useMemo, useState } from "react";
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

export type OnboardingData = {
  name: string;
  description: string;
  industry: string;
  website?: string;
  location?: string;

  logo?: string; // data url preview only for now
  primaryColor?: string;
  secondaryColor?: string;
  fonts?: string;
  tone?: string;

  audience?: string;
  painPoints?: string;
  langs: { en: boolean; es: boolean };

  goal: "leads" | "sales" | "awareness" | "retention";
  monthlyTarget?: number;

  social: string[];
  emailProvider?: string;
  whatsapp?: boolean;
  rss?: string;

  competitors?: string[];
};

const steps = ["basic", "brand", "audience", "goals", "connections", "competitors", "review"] as const;

type StepKey = typeof steps[number];

const Onboarding = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepKey>("basic");
  const [data, setData] = useState<OnboardingData>({
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

  const canNext = useMemo(() => {
    if (step === "basic") return data.name && data.description && data.industry;
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
        const { error } = await supabase
          .from("onboarding")
          .upsert({ user_id: user.id, data }, { onConflict: "user_id" });
        if (error) throw error;
        toast.success("Onboarding saved to your account.");
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
            <CardTitle className="text-base">Steps</CardTitle>
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
            {step === "basic" && (
              <section className="space-y-4">
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

            {step === "brand" && (
              <section className="space-y-4">
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
              </section>
            )}

            {step === "audience" && (
              <section className="space-y-4">
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
              </section>
            )}

            {step === "goals" && (
              <section className="space-y-4">
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
              </section>
            )}

            {step === "connections" && (
              <section className="space-y-4">
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
              </section>
            )}

            {step === "competitors" && (
              <section className="space-y-4">
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
              </section>
            )}

            {step === "review" && (
              <section className="space-y-4">
                <p className="text-sm text-muted-foreground">Review your inputs. Click Finish to proceed to your workspace.</p>
                <pre className="rounded-md border bg-muted/40 p-4 text-xs overflow-auto max-h-[320px]">{JSON.stringify(data, null, 2)}</pre>
              </section>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={back} disabled={step === "basic"}>{t("action.back")}</Button>
              {step !== "review" ? (
                <Button variant="default" onClick={() => canNext ? next() : toast.error("Please complete required fields")}>{t("action.next")}</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => toast.info("AI plan generation will be available after Supabase integration.")}>{t("action.generate")}</Button>
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
