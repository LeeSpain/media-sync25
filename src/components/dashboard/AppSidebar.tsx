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
    const open = false; // overlay disabled in favor of full Admin routes
    setAdminOpen(open);
  }, [location]);

  const handleCloseAdmin = () => {
    // overlay disabled
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
                  <NavLink to="/admin" end className={getNavCls} aria-label="Admin">
                    <Shield className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Admin</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
