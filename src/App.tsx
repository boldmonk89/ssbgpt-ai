import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "./pages/Dashboard";
import FullAnalysisPage from "./pages/FullAnalysis";
import PIQPage from "./pages/PIQ";
import TATPage from "./pages/TAT";
import WATPage from "./pages/WAT";
import SRTPage from "./pages/SRT";
import SDPage from "./pages/SD";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/full-analysis" element={<FullAnalysisPage />} />
            <Route path="/piq" element={<PIQPage />} />
            <Route path="/tat" element={<TATPage />} />
            <Route path="/wat" element={<WATPage />} />
            <Route path="/srt" element={<SRTPage />} />
            <Route path="/sd" element={<SDPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
