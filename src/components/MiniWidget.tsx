import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Maximize2, 
  MoreVertical, 
  Settings, 
  X,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWindowControls } from '@/hooks/useElectronApi';
import { useNova } from '@/context/NovaContext';

/**
 * Nova MiniWidget - Compact always-on-top floating assistant
 * 
 * Features:
 * - Draggable to screen edges
 * - Double-click to expand to full chat
 * - Hover preview of last message
 * - Mic mute indicator and controls
 * - Context menu with quick actions
 * - Unread message badge
 * - Privacy indicator for local voice
 * - Glassmorphism design with Nova theme
 */

interface MiniWidgetProps {
  /** Optional className for styling overrides */
  className?: string;
  /** Show expanded preview on hover */
  showPreview?: boolean;
  /** Unread message count */
  unreadCount?: number;
}

export default function MiniWidget({ 
  className = '', 
  showPreview = true,
  unreadCount = 0 
}: MiniWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState(false);
  
  const widgetRef = useRef<HTMLDivElement>(null);
  const { expand, minimize } = useWindowControls();
  const { state } = useNova();

  // Get last message for preview
  const lastMessage = state.currentSession?.messages[state.currentSession.messages.length - 1];

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const handleMouseMove = (e: MouseEvent) => {
        setPosition({
          x: e.clientX - offsetX,
          y: e.clientY - offsetY,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  // Handle double-click to expand
  const handleDoubleClick = () => {
    expand();
  };

  // Handle click outside to minimize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        // Call Electron API
        window.api?.requestMinimize();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <motion.div
      ref={widgetRef}
      className={`fixed z-50 select-none ${className}`}
      style={{ 
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Main Widget Container */}
      <div className="relative">
        {/* Core Widget */}
        <motion.div
          className="w-20 h-20 glass-nova rounded-full flex items-center justify-center relative glow-nova-strong border-2 border-primary/30"
          animate={{
            width: isHovered ? 110 : 80,
            height: isHovered ? 110 : 80,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {/* Nova Logo/Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
            N
          </div>

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}

          {/* Voice Indicator */}
          {state.voiceEnabled && (
            <div className="absolute -bottom-1 -left-1 bg-primary text-primary-foreground rounded-full p-1">
              <Mic size={10} />
            </div>
          )}

          {/* Privacy Badge */}
          <div className="absolute bottom-0 right-0 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 font-medium">
            LOCAL
          </div>
        </motion.div>

        {/* Control Buttons - Show on Hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute -top-2 -right-2 flex gap-1"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: 0.1 }}
            >
              {/* Expand Button */}
              <Button
                size="sm"
                variant="secondary"
                className="w-7 h-7 rounded-full p-0 bg-primary/20 hover:bg-primary/30 border border-primary/40"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  expand();
                }}
              >
                <Maximize2 size={12} />
              </Button>

              {/* Menu Button */}
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-7 h-7 rounded-full p-0 bg-primary/20 hover:bg-primary/30 border border-primary/40"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <MoreVertical size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => expand()}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Open Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-muted-foreground"
                    onClick={() => minimize()}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Hide Widget
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Preview - Show on Hover */}
        <AnimatePresence>
          {isHovered && showPreview && lastMessage && (
            <motion.div
              className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-64 glass-nova rounded-lg p-3 border border-border/50"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ delay: 0.3 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {lastMessage.role === 'assistant' ? 'Nova' : 'You'}
              </div>
              <div className="text-sm text-foreground line-clamp-2">
                {lastMessage.content}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(lastMessage.timestamp).toLocaleTimeString()}
              </div>

              {/* Arrow pointer */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border/50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse Animation for Active Operations */}
        {state.operations.length > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

// Keyboard shortcuts handler
export function useMiniWidgetKeyboard() {
  const { expand, minimize } = useWindowControls();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Space to toggle mini/full
      if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
        event.preventDefault();
        expand(); // TODO: Add toggle logic based on current state
      }

      // Escape to minimize
      if (event.code === 'Escape') {
        minimize();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expand, minimize]);
}

// CSS variables for Electron window integration
export const miniWidgetStyles = `
  :root {
    --nova-widget-bg: rgba(5, 6, 10, 0.95);
    --nova-widget-shadow: 0 20px 40px -10px rgba(0, 183, 199, 0.3);
    --nova-widget-border: rgba(0, 183, 199, 0.3);
  }
  
  .nova-widget-frame {
    background: var(--nova-widget-bg);
    backdrop-filter: blur(20px);
    border-radius: 50%;
    box-shadow: var(--nova-widget-shadow);
    border: 2px solid var(--nova-widget-border);
  }
`;