import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/AuthContext";

// ─── Claude Design pages (active production UI) ───
import BabblHome from "./pages/babbl/Home";
import BabblResult from "./pages/babbl/Result";
import BabblPaywall from "./pages/babbl/Paywall";
import BabblLullaby from "./pages/babbl/Lullaby";

// ─── Legacy Lovable pages — kept accessible for fallback / debug only ───
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Breathing from "./pages/Breathing";
import VoiceSetup from "./pages/VoiceSetup";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LegacyAnalysisRedirect() {
  const { id } = useParams();
  return <Navigate to={`/analysis/${id ?? ""}`} replace />;
}

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
            {/* Auth still reachable for signup/signin */}
            <Route path="/auth" element={<Auth />} />

            {/* ─── Claude Design routes (active) ─── */}
            <Route path="/" element={<BabblHome />} />
            <Route path="/record" element={<BabblHome />} />
            <Route path="/analysis/:id" element={<BabblResult />} />
            <Route path="/upgrade" element={<BabblPaywall />} />
            <Route path="/lullaby" element={<BabblLullaby />} />

            {/* Journal : la saisie de la tétée, de la couche et du réveil vit ici.
                Plusieurs écrans y renvoient (connexion, bienvenue, respiration). */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/report" element={<Report />} />

            {/* Anciennes adresses : redirigées, l'ancien écran de résultat n'est plus servi. */}
            <Route path="/legacy/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/legacy/history" element={<Navigate to="/history" replace />} />
            <Route path="/legacy/record" element={<Navigate to="/" replace />} />
            <Route path="/legacy/analysis/:id" element={<LegacyAnalysisRedirect />} />
            <Route path="/legacy/breathing" element={<Navigate to="/breathing" replace />} />
            <Route path="/breathing" element={<Breathing />} />
            <Route path="/voice-setup" element={<VoiceSetup />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
