import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Referral from "./pages/Referral";
import Marketplace from "./pages/Marketplace";
import ObjectDetail from "./pages/ObjectDetail";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import SuperAdmin from "./pages/SuperAdmin";
import Agency from "./pages/Agency";
import AcceptInvite from "./pages/AcceptInvite";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Offer from "./pages/Offer";
import AiRules from "./pages/AiRules";
import Consent from "./pages/Consent";
import NotFound from "./pages/NotFound";
import func2url from "../backend/func2url.json";

const queryClient = new QueryClient();

// Сохраняем реферальный код и фиксируем клик при переходе по ссылке /?ref=XXXXXXXX
if (typeof window !== "undefined") {
  const ref = new URLSearchParams(window.location.search).get("ref")
  if (ref) {
    localStorage.setItem("k24_ref_code", ref)
    // Записываем клик на бэкенд (fire-and-forget)
    const authUrl = (func2url as Record<string, string>)["auth-email-auth"]
    if (authUrl) {
      fetch(`${authUrl}?action=referral-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_code: ref.slice(0, 8) }),
      }).catch(() => {})
    }
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/ecosystem" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/object/:id" element={<ObjectDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agency/:id" element={<Agency />} />
            <Route path="/invite/:token" element={<AcceptInvite />} />
            <Route path="/admin-k24" element={<AdminPanel />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/offer" element={<Offer />} />
            <Route path="/ai-rules" element={<AiRules />} />
            <Route path="/consent" element={<Consent />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;