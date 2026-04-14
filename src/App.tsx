import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import { Loader2 } from "lucide-react";

// Lazy load all pages so a crash in one page cannot unmount the entire app
const DashboardPage   = lazy(() => import("./pages/Dashboard"));
const PIQPage         = lazy(() => import("./pages/PIQ"));
const TATPage         = lazy(() => import("./pages/TAT"));
const WATPage         = lazy(() => import("./pages/WAT"));
const SRTPage         = lazy(() => import("./pages/SRT"));
const SDPage          = lazy(() => import("./pages/SD"));
const AIPracticePage  = lazy(() => import("./pages/AIPractice"));
const GTOPage         = lazy(() => import("./pages/GTO"));
const HistoryPage     = lazy(() => import("./pages/History"));
const InterviewPage   = lazy(() => import("./pages/Interview"));
const FullAnalysisPage = lazy(() => import("./pages/FullAnalysis"));
const PracticeLabPage = lazy(() => import("./pages/PracticeLab"));
const NotFound        = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-gold" />
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="*" element={
              <AppLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"              element={<DashboardPage />} />
                    <Route path="/piq"           element={<PIQPage />} />
                    <Route path="/tat"           element={<TATPage />} />
                    <Route path="/wat"           element={<WATPage />} />
                    <Route path="/srt"           element={<SRTPage />} />
                    <Route path="/sd"            element={<SDPage />} />
                    <Route path="/ai-practice"   element={<AIPracticePage />} />
                    <Route path="/gto"           element={<GTOPage />} />
                    <Route path="/history"       element={<HistoryPage />} />
                    <Route path="/interview"     element={<InterviewPage />} />
                    <Route path="/full-analysis" element={<FullAnalysisPage />} />
                    <Route path="/practice-lab"  element={<PracticeLabPage />} />
                    <Route path="*"              element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
