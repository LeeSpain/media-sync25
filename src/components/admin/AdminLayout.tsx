import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          
          <div className="flex-1">
            <section className="p-4 md:p-6">
              <Outlet />
            </section>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
