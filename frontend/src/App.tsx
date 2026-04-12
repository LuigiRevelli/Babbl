import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Record from "./pages/Record";
import AnalysisResult from "./pages/AnalysisResult";
import Breathing from "./pages/Breathing";
import NightMode from "./pages/NightMode";
import VoiceSetup from "./pages/VoiceSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
