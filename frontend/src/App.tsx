import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/AuthContext";

import { lazy, Suspense } from "react";

// Chargés d'emblée : l'écran d'écoute et le journal (adresse de départ de
// l'app installée). Le reste arrive à la demande — le premier affichage, la
// nuit sur un téléphone, ne doit pas attendre les graphiques ni la berceuse.
import BabblHome from "./pages/babbl/Home";
import Dashboard from "./pages/Dashboard";

const BabblResult = lazy(() => import("./pages/babbl/Result"));
const BabblPaywall = lazy(() => import("./pages/babbl/Paywall"));
const BabblLullaby = lazy(() => import("./pages/babbl/Lullaby"));
const Auth = lazy(() => import("./pages/Auth"));
const History = lazy(() => import("./pages/History"));
const Breathing = lazy(() => import("./pages/Breathing"));
const VoiceSetup = lazy(() => import("./pages/VoiceSetup"));
const Report = lazy(() => import("./pages/Report"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
