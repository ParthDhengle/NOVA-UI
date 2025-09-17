import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NovaProvider } from "@/context/NovaContext";
import MiniWidget from "@/components/MiniWidget"; // Assume this exists
import MainLayout from "@/components/MainLayout"; // NEW: Import MainLayout
import SchedulerKanban from "@/components/SchedulerKanban"; // Assume this exists
import DashboardCard from "@/components/DashboardCard"; // Assume this exists
import Settings from "@/components/Settings"; // Assume this exists
import { useNova } from "@/context/NovaContext";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
function AppContent() {
  const { state } = useNova();
  // Fixed: Handle URL + global flag for prod (no ?mini=true on file load)
  const urlParams = new URLSearchParams(window.location.search);
  const isMini = urlParams.get('mini') === 'true' ||
                 (typeof window !== 'undefined' && (window as any).isMiniMode) || // Prod flag
                 state.isMiniMode;
  if (isMini) {
    return <MiniWidget unreadCount={2} />;
  }
 
  if (state.isMiniMode) {
    return <MiniWidget unreadCount={2} />;
  }
  // NEW: Wrap all views in MainLayout for consistent navigation
  return <MainLayout />;
}
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <NovaProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<AppContent />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </NovaProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;