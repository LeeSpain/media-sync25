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

const Register = () => {
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
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const companyName = String(fd.get("company_name") || "");
    const companyWebsite = String(fd.get("company_website") || "");
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name },
      },
    });

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      return;
    }

    // If user is logged in immediately (no email confirmation required)
    if (data.session) {
      const userId = data.session.user.id;
      try {
        // Save display name
        await supabase.from("profiles").update({ display_name: name }).eq("id", userId);

        // Create or reuse company
        if (companyName || companyWebsite) {
          const { data: existing } = await supabase
            .from("crm_companies")
            .select("id")
            .eq("created_by", userId)
            .or(
              [
                companyWebsite ? `website.eq.${companyWebsite}` : undefined,
                companyName ? `name.eq.${companyName}` : undefined,
              ].filter(Boolean).join(",")
            )
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from("crm_companies").insert({
              name: companyName || companyWebsite || "My Company",
              website: companyWebsite || null,
              created_by: userId,
            });
          }
        }

        toast({ title: "Account created", description: "Redirecting to dashboard..." });
      } catch (e: any) {
        console.error("Post-signup setup error", e);
      } finally {
        navigate("/dashboard", { replace: true });
      }
    } else {
      // Store for later creation after email confirmation
      localStorage.setItem(
        "pending_registration_company",
        JSON.stringify({ name, companyName, companyWebsite })
      );
      toast({ title: "Check your email", description: "Confirm your email to finish registration." });
    }
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast({ title: "Google sign-up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Continue in Google", description: "Complete sign-up in the opened window." });
    }
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
                <Input id="name" name="name" type="text" required placeholder="Alex Johnson" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email") || "Email"}</Label>
                <Input id="email" name="email" type="email" required placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password") || "Password"}</Label>
                <Input id="password" name="password" type="password" required placeholder="••••••••" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company name</Label>
                  <Input id="company_name" name="company_name" type="text" placeholder="Acme Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_website">Company website</Label>
                  <Input id="company_website" name="company_website" type="url" placeholder="https://acme.com" />
                </div>
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
