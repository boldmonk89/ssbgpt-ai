import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import DashboardPage from "./pages/Dashboard";
import CrossMatchPage from "./pages/CrossMatch";
import PIQPage from "./pages/PIQ";
import TATPage from "./pages/TAT";
import WATPage from "./pages/WAT";
import SRTPage from "./pages/SRT";
import SDPage from "./pages/SD";
import AIPracticePage from "./pages/AIPractice";
import GTOPage from "./pages/GTO";
import HistoryPage from "./pages/History";
import InterviewPage from "./pages/Interview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="*" element={
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/cross-match" element={<CrossMatchPage />} />
                <Route path="/piq" element={<PIQPage />} />
                <Route path="/tat" element={<TATPage />} />
                <Route path="/wat" element={<WATPage />} />
                <Route path="/srt" element={<SRTPage />} />
                <Route path="/sd" element={<SDPage />} />
                <Route path="/ai-practice" element={<AIPracticePage />} />
                <Route path="/gto" element={<GTOPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/interview" element={<InterviewPage />} />
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
