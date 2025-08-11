import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useI18n } from "@/i18n";
import { Link, useNavigate } from "react-router-dom";
import { FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard", { replace: true });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Signed in", description: "Redirecting to dashboard..." });
      navigate("/dashboard", { replace: true });
    }
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Continue in Google",
        description: "Complete sign-in in the opened window.",
      });
    }
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
                <Input id="email" name="email" type="email" required placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password") || "Password"}</Label>
                <Input id="password" name="password" type="password" required placeholder="••••••••" />
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
