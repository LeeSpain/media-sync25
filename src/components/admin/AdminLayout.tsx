import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center gap-3 px-3 md:px-4">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <h1 className="text-base font-semibold">Admin</h1>
          </header>
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
