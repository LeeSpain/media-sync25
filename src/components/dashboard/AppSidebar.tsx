import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpenText,
  Briefcase,
  Calendar,
  Hash,
  Home,
  Mail,
  MessageSquareText,
  Settings,
  Shield,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import AdminOverview from "@/components/admin/panels/AdminOverview";

type Item = { title: string; url: string; icon: LucideIcon };

const items: Item[] = [
  { title: "Overview", url: "/dashboard/overview", icon: Home },
  { title: "CRM", url: "/dashboard/crm", icon: Briefcase },
  { title: "Planner", url: "/dashboard/planner", icon: Calendar },
  { title: "Content", url: "/dashboard/content", icon: BookOpenText },
  { title: "Social", url: "/dashboard/social", icon: Hash },
  { title: "Email", url: "/dashboard/email", icon: Mail },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquareText },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

function getNavCls({ isActive }: { isActive: boolean }) {
  return [
    "w-full justify-start",
    isActive ? "bg-accent text-accent-foreground" : "",
  ].join(" ");
}

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    const open = location.hash === "#admin";
    setAdminOpen(open);
  }, [location]);

  const handleCloseAdmin = () => {
    // remove the #admin hash but keep on settings page
    if (location.pathname.startsWith("/dashboard/settings")) {
      navigate("/dashboard/settings", { replace: true });
    } else {
      navigate(location.pathname, { replace: true });
    }
    setAdminOpen(false);
  };

  return (
    <Sidebar className="border-r pt-14" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} aria-label={item.title}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/settings#admin" end className={getNavCls} aria-label="Admin">
                    <Shield className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Admin</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Admin Drawer overlay when hash = #admin */}
      {adminOpen && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm">
          <div className="absolute inset-y-0 right-0 w-full md:w-[720px] lg:w-[860px] bg-background border-l shadow-xl overflow-y-auto">
            <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
              <div className="flex items-center justify-between p-4">
                <div className="text-base font-semibold">Admin Console</div>
                <button
                  onClick={handleCloseAdmin}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  aria-label="Close Admin"
                >
                  Close
                </button>
              </div>
            </div>
            <AdminOverview />
          </div>
          <button
            aria-label="Close Overlay"
            onClick={handleCloseAdmin}
            className="absolute inset-0 -z-10"
          />
        </div>
      )}
    </Sidebar>
  );
};

export default AppSidebar;
