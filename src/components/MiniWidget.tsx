import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Maximize2,
  MoreVertical,
  Settings,
  X,
  MessageSquare,
  Send,
  User,
  Bot // For message avatars
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWindowControls } from '@/hooks/useElectronApi';
import { useNova } from '@/context/NovaContext';

/**
 * Nova MiniWidget - Small phone-like chat interface
 * Draggable header, preview messages, mini input, maximize button.
 */
interface MiniWidgetProps {
  className?: string;
  unreadCount?: number;
}

export default function MiniWidget({
  className = '',
  unreadCount = 0
}: MiniWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [miniMessage, setMiniMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { expand: ipcExpand } = useWindowControls(); // Renamed to avoid conflict
  const { state, dispatch } = useNova(); // NEW: Get dispatch for dev simulation

  // Last 3 messages for preview
  const previewMessages = state.currentSession?.messages.slice(-3) || [];

  // FIXED: Handle expand with dev simulation
// Inside MiniWidget (replace handleExpand only):
const handleExpand = async () => {
  if (miniMessage.trim()) {
    console.log('Mini send:', miniMessage); // Optional: Handle send first
    setMiniMessage('');
  }
  try {
    console.log('MINI: Button clicked—awaiting IPC expand...'); // Log A: Renderer button
    await ipcExpand(); // Awaits invoke from hook
    console.log('MINI: IPC expand complete—window should switch'); // Log B: Success
  } catch (error) {
    console.error('MINI: Expand failed:', error); // Log C: Errors (e.g., no window.api)
  }
};

  // Auto-scroll preview
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [previewMessages]);

  return (
    <motion.div
      className={`glass-nova rounded-xl overflow-hidden border border-primary/30 shadow-2xl w-full h-full max-w-full ${className}`} // FIXED: overflow-hidden + max-w-full kills x/y scroll
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Draggable Header - FIXED: Sticky, no scroll */}
      <div className="titlebar bg-background/90 flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground border-b border-border/50 sticky top-0 z-10 flex-shrink-0"> {/* FIXED: sticky + flex-shrink-0 */}
        <span>Nova Chat</span>
        <div className="flex items-center gap-1" style={{ ['-webkit-app-region']: 'no-drag' }}>
          {/* Expand Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExpand} // FIXED: Use handleExpand
            className="w-6 h-6 p-0"
            title="Expand to full chat"
          >
            <Maximize2 size={12} />
          </Button>
          {/* Menu */}
          <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                <MoreVertical size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExpand}> {/* FIXED: Use handleExpand */}
                <MessageSquare className="mr-2 h-4 w-4" />
                Full Chat
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.api?.requestMinimize?.()}>
                <X className="mr-2 h-4 w-4" />
                Hide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Preview - ONLY this scrolls */}
      <ScrollArea className="flex-1 px-3 py-2 max-w-full" ref={scrollRef}> {/* FIXED: max-w-full constrains width */}
        <div className="space-y-2 max-w-full"> {/* FIXED: max-w-full no x-overflow */}
          {previewMessages.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4">
              Start a conversation!
            </div>
          ) : (
            previewMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[200px] rounded-lg px-2 py-1 text-xs max-w-full break-words ${ // FIXED: max-w-full + break-words for long text
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-medium">{msg.role === 'user' ? 'You' : 'Nova'}</span>
                    <span className="text-[10px] opacity-50">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))
          )}
          {unreadCount > 0 && (
            <div className="text-center">
              <Badge variant="secondary" className="text-xs">
                +{unreadCount} unread
              </Badge>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Mini Input - FIXED: Sticky bottom, no scroll */}
      <div className="border-t border-border/50 p-2 bg-background/50 sticky bottom-0 z-10 flex-shrink-0 max-w-full"> {/* FIXED: sticky + flex-shrink-0 + max-w-full */}
        <div className="flex gap-1">
          <Input
            value={miniMessage}
            onChange={(e) => setMiniMessage(e.target.value)}
            placeholder="Quick message..."
            className="text-xs h-8 flex-1 max-w-full" // FIXED: max-w-full
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleMiniSend(); // FIXED: Use handleExpand (renamed from handleMiniSend for clarity)
              }
            }}
          />
          <Button onClick={handleExpand} size="sm" className="w-8 h-8 p-0"> {/* FIXED: handleExpand */}
            <Send size={12} />
          </Button>
        </div>
        {state.voiceEnabled && (
          <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground max-w-full"> {/* FIXED: max-w-full */}
            <Mic size={10} className="mr-1" />
            Voice ready
          </div>
        )}
      </div>

      {/* Pulse if active ops */}
      {state.operations.length > 0 && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse opacity-20"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

// Keyboard shortcuts handler (unchanged)
export function useMiniWidgetKeyboard() {
  const { expand: ipcExpand, minimize } = useWindowControls();
  const { dispatch } = useNova(); // NEW: For dev simulation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Space to toggle mini/full
      if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
        event.preventDefault();
        if (window.api) {
          ipcExpand();
        } else {
          dispatch({ type: 'SET_MINI_MODE', payload: false });
        }
      }
      // Escape to minimize
      if (event.code === 'Escape') {
        minimize();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ipcExpand, minimize, dispatch]);
}

// CSS variables (unchanged)
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