import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Header from "./components/layout/Header";
import { I18nProvider } from "./i18n";
import Onboarding from "./pages/Onboarding";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CheckEmail from "./pages/CheckEmail";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Planner from "./pages/dashboard/Planner";
import Content from "./pages/dashboard/Content";
import CRM from "./pages/dashboard/CRM";
import Automations from "./pages/dashboard/Automations";
import Social from "./pages/dashboard/Social";
import Email from "./pages/dashboard/Email";
import Messages from "./pages/dashboard/Messages";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import CalendarPage from "./pages/dashboard/Calendar";
import DashboardVideo from "./pages/dashboard/Video";
import AdminLayout from "./components/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/Overview";
import AdminMembersPage from "./pages/admin/Members";
import AdminSettingsPage from "./pages/admin/Settings";
import ContentAI from "./pages/admin/ContentAI";
import SalesAI from "./pages/admin/SalesAI";
import AdminVideo from "./pages/admin/Video";
import AdminGate from "./components/auth/AdminGate";
import ModuleGate from "./components/auth/ModuleGate";
 
 
const queryClient = new QueryClient();
 
const App = () => {
  console.log("App component loaded");
  return (
    <QueryClientProvider client={queryClient}>
      <Sonner />
      <Toaster />
      <BrowserRouter>
        <I18nProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="planner" element={<ModuleGate module="module_planner"><Planner /></ModuleGate>} />
              <Route path="content" element={<ModuleGate module="module_content"><Content /></ModuleGate>} />
              <Route path="crm" element={<ModuleGate module="module_crm"><CRM /></ModuleGate>} />
              <Route path="automate" element={<Automations />} />
              <Route path="social" element={<ModuleGate module="module_social"><Social /></ModuleGate>} />
              <Route path="email" element={<ModuleGate module="module_email"><Email /></ModuleGate>} />
              <Route path="messages" element={<ModuleGate module="module_messages"><Messages /></ModuleGate>} />
              <Route path="analytics" element={<ModuleGate module="module_analytics"><Analytics /></ModuleGate>} />
              <Route path="video" element={<ModuleGate module="module_social_youtube"><DashboardVideo /></ModuleGate>} />
              <Route path="settings" element={<Settings />} />
              <Route path="calendar" element={<CalendarPage />} />
            </Route>
            <Route path="/admin" element={<AdminGate><AdminLayout /></AdminGate>}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="content-ai" element={<ContentAI />} />
              <Route path="sales-ai" element={<SalesAI />} />
              <Route path="video" element={<AdminVideo />} />
              <Route path="members" element={<AdminMembersPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </I18nProvider>
    </BrowserRouter>
  </QueryClientProvider>
  );
};
 
export default App;
