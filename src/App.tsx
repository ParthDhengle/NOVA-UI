import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NovaProvider } from "@/context/NovaContext";
import MiniWidget from "@/components/MiniWidget"; // Assume this exists
import FullChat from "@/components/FullChat"; // Assume this exists
import SchedulerKanban from "@/components/SchedulerKanban"; // Assume this exists
import DashboardCard from "@/components/DashboardCard"; // Assume this exists
import Settings from "@/components/Settings"; // Assume this exists
import { useNova } from "@/context/NovaContext";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { state } = useNova();
  // Handle URL params reliably (works for both http://... and file:// loads)
  const urlParams = new URLSearchParams(window.location.search);
  const isMini = urlParams.get('mini') === 'true' || state.isMiniMode;
  
  if (isMini) {
    return <MiniWidget unreadCount={2} />;
  }
  
  if (state.isMiniMode) {
    return <MiniWidget unreadCount={2} />;
  }

  switch (state.view) {
    case 'scheduler':
      return <SchedulerKanban />;
    case 'dashboard':
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <DashboardCard />
        </div>
      );
    case 'settings':
      return <Settings />;
    default:
      return <FullChat />;
  }
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