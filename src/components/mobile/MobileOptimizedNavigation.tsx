import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { 
  Menu,
  X,
  Home,
  MessageCircle,
  Users,
  BarChart3,
  FileText,
  Video,
  Mail,
  Calendar,
  Settings,
  HelpCircle,
  Zap,
  Bell,
  Search,
  ChevronDown,
  Plus
} from "lucide-react";

type MobileMenuProps = {
  currentPath: string;
};

const navigationItems = [
  { 
    path: "/dashboard", 
    label: "Overview", 
    icon: <Home className="h-5 w-5" />,
    description: "Dashboard home"
  },
  { 
    path: "/dashboard/crm", 
    label: "CRM", 
    icon: <Users className="h-5 w-5" />,
    description: "Manage contacts & deals"
  },
  { 
    path: "/dashboard/content", 
    label: "Content", 
    icon: <FileText className="h-5 w-5" />,
    description: "Create & manage content"
  },
  { 
    path: "/dashboard/social", 
    label: "Social", 
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Social media management"
  },
  { 
    path: "/dashboard/email", 
    label: "Email", 
    icon: <Mail className="h-5 w-5" />,
    description: "Email campaigns"
  },
  { 
    path: "/dashboard/messages", 
    label: "Messages", 
    icon: <MessageCircle className="h-5 w-5" />,
    description: "Customer conversations"
  },
  { 
    path: "/dashboard/video", 
    label: "Video", 
    icon: <Video className="h-5 w-5" />,
    description: "Video creation studio"
  },
  { 
    path: "/dashboard/analytics", 
    label: "Analytics", 
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Performance insights"
  },
  { 
    path: "/dashboard/planner", 
    label: "Planner", 
    icon: <Calendar className="h-5 w-5" />,
    description: "Content calendar"
  }
];

export default function MobileOptimizedNavigation({ currentPath }: MobileMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const currentItem = navigationItems.find(item => item.path === currentPath);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left side - Menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-600 rounded-lg flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold">MediaSync</h2>
                      <p className="text-xs text-muted-foreground">AI Marketing Platform</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {navigationItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                          ${currentPath === item.path 
                            ? 'bg-primary text-primary-foreground' 
                            : 'hover:bg-muted'
                          }
                        `}
                      >
                        {item.icon}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.label}</div>
                          <div className="text-xs opacity-70">{item.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="p-4 border-t mt-4">
                    <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2"
                        onClick={() => handleNavigation('/dashboard/content')}
                      >
                        <Plus className="h-4 w-4" />
                        Create Content
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2"
                        onClick={() => handleNavigation('/dashboard/social')}
                      >
                        <MessageCircle className="h-4 w-4" />
                        New Post
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start gap-2"
                        onClick={() => handleNavigation('/dashboard/crm')}
                      >
                        <Users className="h-4 w-4" />
                        Add Contact
                      </Button>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="p-4 border-t">
                    <button
                      onClick={() => handleNavigation('/dashboard/settings')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-muted transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Center - Current page */}
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-lg truncate">
              {currentItem?.label || "Dashboard"}
            </h1>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[10px] text-white">3</span>
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <div className="p-6">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      onClick={() => {
                        handleNavigation('/dashboard/content');
                        setShowQuickActions(false);
                      }}
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-xs">Content</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      onClick={() => {
                        handleNavigation('/dashboard/social');
                        setShowQuickActions(false);
                      }}
                    >
                      <MessageCircle className="h-6 w-6" />
                      <span className="text-xs">Social Post</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      onClick={() => {
                        handleNavigation('/dashboard/email');
                        setShowQuickActions(false);
                      }}
                    >
                      <Mail className="h-6 w-6" />
                      <span className="text-xs">Email</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2"
                      onClick={() => {
                        handleNavigation('/dashboard/video');
                        setShowQuickActions(false);
                      }}
                    >
                      <Video className="h-6 w-6" />
                      <span className="text-xs">Video</span>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems.slice(0, 5).map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                ${currentPath === item.path 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              {React.cloneElement(item.icon, { 
                className: `h-5 w-5 ${currentPath === item.path ? 'scale-110' : ''}` 
              })}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile spacing for bottom tab bar */}
      <div className="lg:hidden h-20" />
    </>
  );
}