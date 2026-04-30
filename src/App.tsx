import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { lazy, Suspense } from "react";
import Marketplace from "./pages/Marketplace";
import func2url from "../backend/func2url.json";

const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const Referral = lazy(() => import("./pages/Referral"));
const ObjectDetail = lazy(() => import("./pages/ObjectDetail"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const Agency = lazy(() => import("./pages/Agency"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Offer = lazy(() => import("./pages/Offer"));
const AiRules = lazy(() => import("./pages/AiRules"));
const Consent = lazy(() => import("./pages/Consent"));
const Club = lazy(() => import("./pages/Club"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <Suspense fallback={null}>
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
              <Route path="/club" element={<Club />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;