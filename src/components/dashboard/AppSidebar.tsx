import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  CalendarDays,
  FolderOpen,
  Users,
  GitBranch,
  Share2,
  Mail,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";

type Item = { title: string; url: string; icon: LucideIcon };

const items: Item[] = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Campaign Planner", url: "/dashboard/planner", icon: CalendarDays },
  { title: "Content Library", url: "/dashboard/content", icon: FolderOpen },
  { title: "CRM & Sales", url: "/dashboard/crm", icon: Users },
  { title: "Automations Hub", url: "/dashboard/automate", icon: GitBranch },
  { title: "Social Media", url: "/dashboard/social", icon: Share2 },
  { title: "Email Marketing", url: "/dashboard/email", icon: Mail },
  { title: "WhatsApp & SMS", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Analytics & Reports", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const getNavCls = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "bg-accent text-accent-foreground font-medium"
    : "hover:bg-accent hover:text-accent-foreground";

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className="border-r pt-14" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Media-Sync</SidebarGroupLabel>
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

      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
