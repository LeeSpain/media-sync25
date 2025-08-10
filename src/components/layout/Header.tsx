import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const Header = () => {
  const { t, lang, setLang } = useI18n();
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">
          {t("app.name")}
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/onboarding" className="px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground">
            {t("nav.onboarding")}
          </Link>
          <Link to="/dashboard" className={`px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground ${pathname.startsWith("/dashboard") ? "bg-accent text-accent-foreground" : ""}`}>
            {t("nav.dashboard")}
          </Link>
          <Link to="/admin" className={`px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground ${pathname.startsWith("/admin") ? "bg-accent text-accent-foreground" : ""}`}>
            {t("nav.admin")}
          </Link>
          <div className="ml-2 flex items-center gap-1">
            <Button variant="outline" size="sm" aria-label="Switch language" onClick={() => setLang(lang === "en" ? "es" : "en")}> {lang.toUpperCase()} </Button>
            <Link to="/onboarding">
              <Button variant="hero" size="sm">{t("nav.getStarted")}</Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
