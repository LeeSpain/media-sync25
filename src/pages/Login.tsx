import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n";
import { Link } from "react-router-dom";
import { FormEvent } from "react";

const Login = () => {
  const { t } = useI18n();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast({
      title: t("auth.loginPending") || "Login pending",
      description:
        t("auth.connectSupabase") ||
        "Please connect Supabase to enable email/password and Google login.",
    });
  };

  const onGoogle = () => {
    toast({
      title: t("auth.googlePending") || "Google sign-in pending",
      description:
        t("auth.connectSupabase") ||
        "Please connect Supabase to enable Google OAuth.",
    });
  };

  return (
    <main className="container py-10">
      <SEO
        title={`${t("auth.login") || "Login"} | ${t("app.name")}`}
        description={
          t("auth.loginDescription") ||
          "Sign in to access your dashboard, campaigns, and CRM."
        }
        canonical={window.location.href}
      />
      <h1 className="mb-6 text-3xl font-bold">{t("auth.login") || "Login"}</h1>

      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("auth.welcomeBack") || "Welcome back"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email") || "Email"}</Label>
                <Input id="email" type="email" required placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password") || "Password"}</Label>
                <Input id="password" type="password" required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full">
                {t("auth.login") || "Login"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
                {t("auth.continueWithGoogle") || "Continue with Google"}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t("auth.noAccount") || "Don’t have an account?"} {" "}
                <Link to="/register" className="underline">
                  {t("auth.register") || "Register"}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Login;
