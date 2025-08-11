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
  Video as VideoIcon,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useModuleFlags } from "@/hooks/useModuleFlags";

type Item = { title: string; url: string; icon: LucideIcon };

const items: Item[] = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "CRM", url: "/dashboard/crm", icon: Briefcase },
  { title: "Planner", url: "/dashboard/planner", icon: Calendar },
  { title: "Content", url: "/dashboard/content", icon: BookOpenText },
  { title: "Video", url: "/dashboard/video", icon: VideoIcon },
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
  const { flags } = useModuleFlags();

  useEffect(() => {
    const open = false; // overlay disabled in favor of full Admin routes
    setAdminOpen(open);
  }, [location]);

  const handleCloseAdmin = () => {
    // overlay disabled
  };

  const isItemEnabled = (url: string) => {
    const slug = url.replace('/dashboard/', '');
    switch (slug) {
      case 'crm':
        return flags.module_crm?.enabled !== false;
      case 'planner':
        return flags.module_planner?.enabled !== false;
      case 'content':
        return flags.module_content?.enabled !== false;
      case 'video':
        return flags.module_social_youtube?.enabled !== false;
      case 'social':
        return flags.module_social?.enabled !== false;
      case 'email':
        return flags.module_email?.enabled !== false;
      case 'messages':
        return flags.module_messages?.enabled !== false;
      case 'analytics':
        return flags.module_analytics?.enabled !== false;
      case 'settings':
        return true;
      case '': // overview
        return true;
      default:
        return true;
    }
  };

  return (
    <Sidebar className="border-r pt-14" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter((item) => isItemEnabled(item.url))
                .map((item) => (
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
