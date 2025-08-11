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
import { Shield, Briefcase, Calendar, BookOpenText, Hash, Mail, MessageSquareText, BarChart3, Video as VideoIcon, Settings as SettingsIcon } from "lucide-react";

const adminItems = [
  { title: "Overview", url: "/admin", icon: Shield },
  { title: "CRM", url: "/admin/crm", icon: Briefcase },
  { title: "Planner", url: "/admin/planner", icon: Calendar },
  { title: "Content", url: "/admin/content", icon: BookOpenText },
  { title: "Video", url: "/admin/video", icon: VideoIcon },
  { title: "Social", url: "/admin/social", icon: Hash },
  { title: "Email", url: "/admin/email", icon: Mail },
  { title: "Messages", url: "/admin/messages", icon: MessageSquareText },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Admin Settings", url: "/admin/settings", icon: SettingsIcon },
] as const;

const getNavCls = ({ isActive }: { isActive: boolean }) =>
  isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent hover:text-accent-foreground";

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className="border-r pt-14" collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
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

export default AdminSidebar;
