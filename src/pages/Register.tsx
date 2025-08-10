import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n";
import { Link } from "react-router-dom";
import { FormEvent } from "react";

const Register = () => {
  const { t } = useI18n();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({
      title: t("auth.registerPending") || "Registration pending",
      description:
        t("auth.connectSupabase") ||
        "Please connect Supabase to enable email/password registration.",
    });
  };

  const onGoogle = () => {
    toast({
      title: t("auth.googlePending") || "Google sign-up pending",
      description:
        t("auth.connectSupabase") ||
        "Please connect Supabase to enable Google OAuth.",
    });
  };

  return (
    <main className="container py-10">
      <SEO
        title={`${t("auth.register") || "Register"} | ${t("app.name")}`}
        description={
          t("auth.registerDescription") ||
          "Create your account to set up your business, campaigns, and CRM."
        }
        canonical={window.location.href}
      />
      <h1 className="mb-6 text-3xl font-bold">{t("auth.register") || "Register"}</h1>

      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("auth.getStarted") || "Get started"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name") || "Name"}</Label>
                <Input id="name" type="text" required placeholder="Alex Johnson" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email") || "Email"}</Label>
                <Input id="email" type="email" required placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password") || "Password"}</Label>
                <Input id="password" type="password" required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full">
                {t("auth.createAccount") || "Create account"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
                {t("auth.continueWithGoogle") || "Continue with Google"}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t("auth.haveAccount") || "Already have an account?"} {" "}
                <Link to="/login" className="underline">
                  {t("auth.login") || "Login"}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Register;
