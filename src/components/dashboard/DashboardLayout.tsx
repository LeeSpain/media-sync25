import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import DashboardTopBar from "./DashboardTopBar";
import RightAIPanel from "./RightAIPanel";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardTopBar />
          <div className="flex-1 flex">
            <section className="flex-1 p-4 md:p-6">
              <Outlet />
            </section>
            <RightAIPanel />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
