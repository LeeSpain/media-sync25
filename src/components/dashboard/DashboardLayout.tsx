import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "./AppSidebar";
import DashboardTopBar from "./DashboardTopBar";
import MobileOptimizedNavigation from "@/components/mobile/MobileOptimizedNavigation";
import InteractiveTutorials from "@/components/onboarding/InteractiveTutorials";
import BusinessOnboardingModal from "@/components/onboarding/BusinessOnboardingModal";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function DashboardLayout() {
  const location = useLocation();
  const [showTutorials, setShowTutorials] = useState(false);

  // One-time post-confirmation finalization of pending registration data
  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      if (sessionStorage.getItem("pending_registration_processed") === "1") return;
      const raw = localStorage.getItem("pending_registration");
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        const userId = session.user.id;
        if (payload.name) {
          await supabase.from("profiles").update({ display_name: payload.name }).eq("id", userId);
        }
        let companyId: string | null = null;
        if (payload.companyName || payload.companyWebsite) {
          const { data: existing } = await supabase
            .from("crm_companies")
            .select("id")
            .eq("created_by", userId)
            .or([
              payload.companyWebsite ? `website.eq.${payload.companyWebsite}` : undefined,
              payload.companyName ? `name.eq.${payload.companyName}` : undefined,
            ].filter(Boolean).join(","))
            .limit(1);
          if (existing && existing.length > 0) {
            companyId = existing[0].id as string;
          } else {
            const { data: inserted } = await supabase
              .from("crm_companies")
              .insert({
                name: payload.companyName || payload.companyWebsite || "My Company",
                website: payload.companyWebsite || null,
                industry: payload.companyIndustry || null,
                created_by: userId,
              })
              .select("id")
              .single();
            companyId = inserted?.id ?? null;
          }
        }
        const { data: contactExisting } = await supabase
          .from("crm_contacts")
          .select("id")
          .eq("created_by", userId)
          .eq("email", payload.email)
          .limit(1);
        if (!contactExisting || contactExisting.length === 0) {
          await supabase.from("crm_contacts").insert({
            created_by: userId,
            email: payload.email || null,
            first_name: payload.name || null,
            job_title: payload.jobTitle || null,
            mobile_phone: payload.phone || null,
            company_id: companyId,
          });
        }
        localStorage.removeItem("pending_registration");
        sessionStorage.setItem("pending_registration_processed", "1");
        toast({ title: "Welcome!", description: "Your account is ready." });
      } catch (e) {
        console.error("Finalize pending registration error", e);
      }
    };
    run();
  }, []);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <AppSidebar />
          </div>
          
          {/* Mobile Navigation */}
          <MobileOptimizedNavigation currentPath={location.pathname} />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Desktop Top Bar */}
            <div className="hidden lg:block">
              <DashboardTopBar />
            </div>
            
            {/* Page Content */}
            <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 lg:pb-6">
              <Outlet />
            </main>
          </div>
        </div>

        {/* Floating Help Button */}
        <div className="fixed bottom-6 right-6 z-40 lg:bottom-8 lg:right-8">
          <Button
            onClick={() => setShowTutorials(true)}
            className="floating-action-button rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
            size="sm"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </div>

        {/* Interactive Tutorials */}
        <InteractiveTutorials 
          isOpen={showTutorials} 
          onClose={() => setShowTutorials(false)} 
        />

        {/* Business Onboarding Modal */}
        <BusinessOnboardingModal />
        
        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
  );
}