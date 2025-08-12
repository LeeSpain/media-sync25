import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { Link } from "react-router-dom";

const CheckEmail = () => {
  const { t } = useI18n();
  const title = `${t("auth.checkEmail") || "Check your email"} | ${t("app.name")}`;
  const description =
    t("auth.checkEmailDescription") ||
    "We sent you a confirmation email. Click the link to access your dashboard.";

  return (
    <main className="container py-10">
      <SEO title={title} description={description} canonical={window.location.href} />
      <h1 className="mb-6 text-3xl font-bold">{t("auth.checkEmail") || "Check your email"}</h1>

      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("auth.almostThere") || "You're almost there"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("auth.checkEmailInstructions") ||
                "We just sent a confirmation link to your inbox. Open it on this device to finish signing in and go to your dashboard."}
            </p>
            <div className="flex items-center gap-3">
              <Button asChild>
                <a href="mailto:">
                  {t("auth.openEmailApp") || "Open email app"}
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">{t("auth.backToLogin") || "Back to login"}</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("auth.didntGetEmail") || "Didn't get the email?"} {" "}
              <span>{t("auth.checkSpamFolder") || "Check your spam folder or try again later."}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default CheckEmail;
