import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Record from "./pages/Record";
import AnalysisResult from "./pages/AnalysisResult";
import Breathing from "./pages/Breathing";
import NightMode from "./pages/NightMode";
import VoiceSetup from "./pages/VoiceSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// NOTE: Auth gating is intentionally OFF in this build — every route is public
// so Luigi (and Claude Design preview viewers) can open the app directly.
// Pages use `user?.id` with optional chaining, so Supabase sync simply no-ops
// when nobody is logged in. To re-enable: wrap the protected routes in a
// <ProtectedRoute> component and gate /auth with <PublicOnly>.

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth screen is still reachable for signup/signin when you want it */}
            <Route path="/auth" element={<Auth />} />

            {/* Everything else is now public — no ProtectedRoute wrapper */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/record" element={<Record />} />
            <Route path="/analysis/:id" element={<AnalysisResult />} />
            <Route path="/breathing" element={<Breathing />} />
            <Route path="/night-mode" element={<NightMode />} />
            <Route path="/voice-setup" element={<VoiceSetup />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
