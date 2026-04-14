import React, { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import { Loader2, AlertTriangle } from "lucide-react";

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

// Global Error Boundary to capture and show exact crash details
class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("DEBUG: Application Crash Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[99999] bg-slate-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-heading font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-6 font-body">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2 rounded-xl text-sm font-semibold transition-all border border-red-500/20"
            >
              Back to Home
            </button>
            <pre className="mt-6 p-4 bg-black/40 rounded-lg text-[10px] text-left overflow-auto max-h-32 text-slate-500">
              {this.state.error?.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  return (
    <GlobalErrorBoundary>
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
    </GlobalErrorBoundary>
  );
};

export default App;
