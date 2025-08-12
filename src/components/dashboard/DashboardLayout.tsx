import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import DashboardTopBar from "./DashboardTopBar";
import BusinessOnboardingModal from "@/components/onboarding/BusinessOnboardingModal";


const DashboardLayout = () => {
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
