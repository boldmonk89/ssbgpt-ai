import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "./pages/Dashboard";
import PIQPage from "./pages/PIQ";
import TATPage from "./pages/TAT";
import WATPage from "./pages/WAT";
import SRTPage from "./pages/SRT";
import SDPage from "./pages/SD";
import AIPracticePage from "./pages/AIPractice";
import GTOPage from "./pages/GTO";
import HistoryPage from "./pages/History";
import InterviewPage from "./pages/Interview";
import FullAnalysisPage from "./pages/FullAnalysis";
import PracticeLabPage from "./pages/PracticeLab";
import NotFound from "./pages/NotFound";
import LoginModal from "./components/LoginModal";
import { useAppStore } from "@/store/appStore";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated } = useAppStore();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        {!isAuthenticated && <LoginModal />}
        <BrowserRouter>
        <Routes>
          <Route path="*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/piq" element={<PIQPage />} />
                <Route path="/tat" element={<TATPage />} />
                <Route path="/wat" element={<WATPage />} />
                <Route path="/srt" element={<SRTPage />} />
                <Route path="/sd" element={<SDPage />} />
                <Route path="/ai-practice" element={<AIPracticePage />} />
                <Route path="/gto" element={<GTOPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/interview" element={<InterviewPage />} />
                <Route path="/full-analysis" element={<FullAnalysisPage />} />
                <Route path="/practice-lab" element={<PracticeLabPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
