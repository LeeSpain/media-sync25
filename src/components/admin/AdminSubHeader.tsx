import { NavLink, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const tabs = [
  { label: "Overview", to: "/admin" },
  { label: "Members", to: "/admin/members" },
  { label: "Settings", to: "/admin/settings" },
] as const;

export default function AdminSubHeader() {
  const location = useLocation();
  const isActive = (to: string) => (to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to));

  return (
    <div className="flex items-center justify-between px-4 md:px-6 h-12">
      <nav className="flex items-center gap-4 text-sm">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive: a }) =>
              `px-2 py-1 rounded-md ${a || isActive(t.to) ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`
            }
            end
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <div className="relative w-64 max-w-[40vw]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 h-8" placeholder="Search admin…" aria-label="Search admin" />
      </div>
    </div>
  );
}
