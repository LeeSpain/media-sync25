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

const Admin = () => {
  const { t } = useI18n();
  const { toast } = useToast();

  const [settings, setSettings] = useState<AdminSettings>({ name: "", website: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  const canonical = useMemo(() => (typeof window !== "undefined" ? window.location.href : undefined), []);

  const handleSave = () => {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(settings));
    toast({ title: t("common.saved"), description: t("common.changesSaved") });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
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
    toast({ title: t("common.deleted"), description: t("common.dataCleared") });
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
