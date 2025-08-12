import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "./AppSidebar";
import DashboardTopBar from "./DashboardTopBar";
import BusinessOnboardingModal from "@/components/onboarding/BusinessOnboardingModal";
const DashboardLayout = () => {
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
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardTopBar />
          <div className="flex-1">
            <section className="p-4 md:p-6">
              <Outlet />
            </section>
          </div>
        </div>
      </div>
      <BusinessOnboardingModal />
    </SidebarProvider>
  );
};

export default DashboardLayout;
