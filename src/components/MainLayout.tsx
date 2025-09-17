import React from 'react';
import { useNova } from '@/context/NovaContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FullChat from './FullChat';
import SchedulerKanban from './SchedulerKanban';
import DashboardCard from './DashboardCard';
import Settings from './Settings';
import AgentOpsPanel from './AgentOpsPanel';

/**
 * MainLayout - Wraps all non-mini views with shared sidebar/topbar
 * Includes hamburger toggle for sidebar access/navigation
 */
interface MainLayoutProps {
  children?: React.ReactNode; // For future extensibility, but uses view prop internally
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { state, dispatch } = useNova();

  // Toggle sidebar via hamburger
  const toggleSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR_COLLAPSED', payload: !state.sidebarCollapsed });
  };

  // Render content based on view (prevents "stuck" by always having navigation)
  const renderContent = () => {
    switch (state.view) {
      case 'chat':
        return <FullChat showSidebar={false} showAgentOps={true} />; // No duplicate sidebar
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
        return <FullChat showSidebar={false} showAgentOps={true} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Topbar with Hamburger */}
      <Topbar 
        showSearch={state.view === 'chat'} // Search only in chat
        // Pass toggle function if needed, but hamburger is here
      >
        {/* Hamburger Button - NEW */}
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleSidebar}
          className="ml-2 w-8 h-8 p-0 lg:hidden" // Mobile-first, but show on desktop too for consistency
        >
          <Menu size={16} />
        </Button>
      </Topbar>

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Collapsible Sidebar */}
        <motion.div
          initial={{ x: state.sidebarCollapsed ? -250 : 0 }}
          animate={{ x: state.sidebarCollapsed ? -250 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="shrink-0 border-r border-border"
        >
          <Sidebar />
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
          
          {/* Agent Ops Panel - Only in chat/scheduler */}
          {['chat', 'scheduler'].includes(state.view) && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-80 shrink-0 border-l border-border"
            >
              <AgentOpsPanel />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}