import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import AdminSidebar from "./AdminSidebar";
import RightAIPanel from "@/components/dashboard/RightAIPanel";
import AdminSubHeader from "./AdminSubHeader";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardTopBar />
          <div className="border-b">
            <AdminSubHeader />
          </div>
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

export default AdminLayout;
