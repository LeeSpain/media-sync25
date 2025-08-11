import { useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n";

const ADMIN_STORAGE_KEY = "adminSettings";

type AdminSettings = {
  name: string;
  website: string;
  // simple placeholders for future use
  emailProvider?: string;
  twilioNumber?: string;
};

type AISettings = {
  openaiApiKey: string;
  emailProvider: "" | "ses" | "sendgrid" | "mailgun";
  sesAccessKeyId?: string;
  sesSecretAccessKey?: string;
  sesRegion?: string;
  sendgridApiKey?: string;
  mailgunApiKey?: string;
  mailgunDomain?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioWhatsAppNumber?: string;
  metaAppId?: string;
  metaAppSecret?: string;
  metaRedirectUri?: string;
  liClientId?: string;
  liClientSecret?: string;
  liRedirectUri?: string;
  ttClientKey?: string;
  ttClientSecret?: string;
  ttRedirectUri?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  appUrl?: string;
  appTimezone?: string;
};

const Admin = () => {
  const { t } = useI18n();
  const { toast } = useToast();

  const [settings, setSettings] = useState<AdminSettings>({ name: "", website: "" });
  const [ai, setAi] = useState<AISettings>({ openaiApiKey: "", emailProvider: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        if (parsed.ai) setAi(parsed.ai);
      }
    } catch {}
  }, []);

  const canonical = useMemo(() => (typeof window !== "undefined" ? window.location.href : undefined), []);

  const handleSave = () => {
    const toSave = { ...settings, ai } as any;
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(toSave));
    toast({ title: t("common.saved"), description: t("common.changesSaved") });
  };

  const handleExport = () => {
    const toExport = { ...settings, ai } as any;
    const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setSettings({ name: "", website: "" });
    setAi({ openaiApiKey: "", emailProvider: "" });
    toast({ title: t("common.deleted"), description: t("common.dataCleared") });
  };

  const handleHealthCheck = () => {
    const missing: string[] = [];
    if (!ai.openaiApiKey) missing.push("OpenAI API Key");
    if (ai.emailProvider === "ses") {
      if (!ai.sesAccessKeyId) missing.push("SES_ACCESS_KEY_ID");
      if (!ai.sesSecretAccessKey) missing.push("SES_SECRET_ACCESS_KEY");
      if (!ai.sesRegion) missing.push("SES_REGION");
    }
    if (ai.emailProvider === "sendgrid" && !ai.sendgridApiKey) missing.push("SENDGRID_API_KEY");
    if (ai.emailProvider === "mailgun") {
      if (!ai.mailgunApiKey) missing.push("MAILGUN_API_KEY");
      if (!ai.mailgunDomain) missing.push("MAILGUN_DOMAIN");
    }

    if (missing.length) {
      toast({ title: t("common.missingFields"), description: missing.join(", "), variant: "destructive" as any });
    } else {
      toast({ title: t("common.healthOk"), description: t("admin.ai.localWarning") });
    }
  };
  return (
    <>
      <SEO title={`${t("admin.title")} | ${t("app.name")}`} description={t("admin.metaDescription")} canonical={canonical} />
      <main className="container py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">{t("admin.title")}</h1>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.sections.general")}</CardTitle>
              <CardDescription>{t("admin.sections.generalDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("admin.fields.name")}</Label>
                <Input id="name" value={settings.name} onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))} placeholder={t("admin.placeholders.name")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">{t("admin.fields.website")}</Label>
                <Input id="website" value={settings.website} onChange={(e) => setSettings((s) => ({ ...s, website: e.target.value }))} placeholder={t("admin.placeholders.website")} />
              </div>
              <div className="pt-2">
                <Button onClick={handleSave}>{t("admin.save")}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("admin.sections.integrations")}</CardTitle>
              <CardDescription>{t("admin.sections.integrationsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="emailProvider">{t("admin.fields.emailProvider")}</Label>
                <Input id="emailProvider" value={settings.emailProvider ?? ""} onChange={(e) => setSettings((s) => ({ ...s, emailProvider: e.target.value }))} placeholder="SMTP / Resend / SendGrid" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twilioNumber">{t("admin.fields.twilioNumber")}</Label>
                <Input id="twilioNumber" value={settings.twilioNumber ?? ""} onChange={(e) => setSettings((s) => ({ ...s, twilioNumber: e.target.value }))} placeholder="+1 555 555 5555" />
              </div>
              <div className="pt-2">
                <Button variant="secondary" onClick={handleSave}>{t("admin.save")}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("admin.sections.ai")}</CardTitle>
              <CardDescription>{t("admin.sections.aiDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <p className="text-sm text-muted-foreground md:col-span-2">{t("admin.ai.localWarning")}</p>

              <div className="grid gap-2">
                <Label htmlFor="openaiApiKey">{t("admin.ai.openaiApiKey")}</Label>
                <Input id="openaiApiKey" type="password" value={ai.openaiApiKey} onChange={(e) => setAi((s) => ({ ...s, openaiApiKey: e.target.value }))} placeholder="sk-..." />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="aiEmailProvider">{t("admin.ai.emailProvider")}</Label>
                <Input id="aiEmailProvider" value={ai.emailProvider} onChange={(e) => setAi((s) => ({ ...s, emailProvider: e.target.value as any }))} placeholder="ses | sendgrid | mailgun" />
              </div>

              {/* SES */}
              <div className="grid gap-2">
                <Label htmlFor="sesAccessKeyId">{t("admin.ai.sesAccessKeyId")}</Label>
                <Input id="sesAccessKeyId" value={ai.sesAccessKeyId ?? ""} onChange={(e) => setAi((s) => ({ ...s, sesAccessKeyId: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sesSecretAccessKey">{t("admin.ai.sesSecretAccessKey")}</Label>
                <Input id="sesSecretAccessKey" type="password" value={ai.sesSecretAccessKey ?? ""} onChange={(e) => setAi((s) => ({ ...s, sesSecretAccessKey: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sesRegion">{t("admin.ai.sesRegion")}</Label>
                <Input id="sesRegion" value={ai.sesRegion ?? ""} onChange={(e) => setAi((s) => ({ ...s, sesRegion: e.target.value }))} />
              </div>

              {/* SendGrid */}
              <div className="grid gap-2">
                <Label htmlFor="sendgridApiKey">{t("admin.ai.sendgridApiKey")}</Label>
                <Input id="sendgridApiKey" type="password" value={ai.sendgridApiKey ?? ""} onChange={(e) => setAi((s) => ({ ...s, sendgridApiKey: e.target.value }))} />
              </div>

              {/* Mailgun */}
              <div className="grid gap-2">
                <Label htmlFor="mailgunApiKey">{t("admin.ai.mailgunApiKey")}</Label>
                <Input id="mailgunApiKey" type="password" value={ai.mailgunApiKey ?? ""} onChange={(e) => setAi((s) => ({ ...s, mailgunApiKey: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mailgunDomain">{t("admin.ai.mailgunDomain")}</Label>
                <Input id="mailgunDomain" value={ai.mailgunDomain ?? ""} onChange={(e) => setAi((s) => ({ ...s, mailgunDomain: e.target.value }))} />
              </div>

              {/* Twilio */}
              <div className="grid gap-2">
                <Label htmlFor="twilioAccountSid">{t("admin.ai.twilioAccountSid")}</Label>
                <Input id="twilioAccountSid" value={ai.twilioAccountSid ?? ""} onChange={(e) => setAi((s) => ({ ...s, twilioAccountSid: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twilioAuthToken">{t("admin.ai.twilioAuthToken")}</Label>
                <Input id="twilioAuthToken" type="password" value={ai.twilioAuthToken ?? ""} onChange={(e) => setAi((s) => ({ ...s, twilioAuthToken: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twilioWhatsAppNumber">{t("admin.ai.twilioWhatsAppNumber")}</Label>
                <Input id="twilioWhatsAppNumber" value={ai.twilioWhatsAppNumber ?? ""} onChange={(e) => setAi((s) => ({ ...s, twilioWhatsAppNumber: e.target.value }))} placeholder="whatsapp:+34..." />
              </div>

              {/* OAuth basics */}
              <div className="grid gap-2">
                <Label htmlFor="appUrl">{t("admin.ai.appUrl")}</Label>
                <Input id="appUrl" value={ai.appUrl ?? ""} onChange={(e) => setAi((s) => ({ ...s, appUrl: e.target.value }))} placeholder="https://yourapp.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="appTimezone">{t("admin.ai.appTimezone")}</Label>
                <Input id="appTimezone" value={ai.appTimezone ?? ""} onChange={(e) => setAi((s) => ({ ...s, appTimezone: e.target.value }))} placeholder="Europe/Madrid" />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                <Button onClick={handleSave}>{t("admin.ai.saveLocal")}</Button>
                <Button variant="outline" onClick={handleHealthCheck}>{t("admin.ai.healthCheck")}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("admin.sections.data")}</CardTitle>
              <CardDescription>{t("admin.sections.dataDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExport}>{t("admin.export")}</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">{t("admin.delete")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("admin.confirmDeleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("admin.confirmDeleteBody")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>{t("action.confirm")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
};

export default Admin;
