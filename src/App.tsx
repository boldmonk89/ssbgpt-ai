import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "./pages/Dashboard";
import FullAnalysisPage from "./pages/FullAnalysis";
import PIQPage from "./pages/PIQ";
import TATPage from "./pages/TAT";
import WATPage from "./pages/WAT";
import SRTPage from "./pages/SRT";
import SDPage from "./pages/SD";
import AIPracticePage from "./pages/AIPractice";
import GTOPage from "./pages/GTO";
import HistoryPage from "./pages/History";
import LoginPage from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={
              <AppLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/full-analysis" element={<FullAnalysisPage />} />
                  <Route path="/piq" element={<PIQPage />} />
                  <Route path="/tat" element={<TATPage />} />
                  <Route path="/wat" element={<WATPage />} />
                  <Route path="/srt" element={<SRTPage />} />
                  <Route path="/sd" element={<SDPage />} />
                  <Route path="/ai-practice" element={<AIPracticePage />} />
                  <Route path="/gto" element={<GTOPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AppLayout>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
