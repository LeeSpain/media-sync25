import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Header from "./components/layout/Header";
import { I18nProvider } from "./i18n";
import Onboarding from "./pages/Onboarding";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <I18nProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Overview />} />
              <Route path="planner" element={<Planner />} />
              <Route path="content" element={<Content />} />
              <Route path="crm" element={<CRM />} />
              <Route path="automate" element={<Automations />} />
              <Route path="social" element={<Social />} />
              <Route path="email" element={<Email />} />
              <Route path="messages" element={<Messages />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </I18nProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
