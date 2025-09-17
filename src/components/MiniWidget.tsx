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
  
  const { maximize } = useWindowControls();
  const { state } = useNova();

  // Last 3 messages for preview
  const previewMessages = state.currentSession?.messages.slice(-3) || [];

  // Send mini message (maximizes + sends)
  const handleMiniSend = () => {
    if (miniMessage.trim()) {
      // TODO: Send via API
      console.log('Mini send:', miniMessage);
      setMiniMessage('');
      maximize(); // Auto-maximize on send
    }
  };

  // Auto-scroll preview
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [previewMessages]);

  return (
    <motion.div
      className={`glass-nova rounded-xl overflow-hidden border border-primary/30 shadow-2xl ${className}`} // Fixed: Rect, no fixed pos (Electron handles)
      style={{ width: 280, height: 400 }} // Phone-like size
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Draggable Header (titlebar) */}
      <div className="titlebar bg-background/90 flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground border-b border-border/50">
        <span>Nova Chat</span>
        <div className="flex items-center gap-1" style={{ ['-webkit-app-region']: 'no-drag' }}>
          {/* maximize Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={maximize}
            className="w-6 h-6 p-0"
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
              <DropdownMenuItem onClick={maximize}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Full Chat
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.api?.requestMinimize()}>
                <X className="mr-2 h-4 w-4" />
                Hide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Preview */}
      <ScrollArea className="flex-1 px-3 py-2" ref={scrollRef}>
        <div className="space-y-2">
          {previewMessages.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4">
              Start a conversation!
            </div>
          ) : (
            previewMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[200px] rounded-lg px-2 py-1 text-xs ${
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

      {/* Mini Input */}
      <div className="border-t border-border/50 p-2 bg-background/50">
        <div className="flex gap-1">
          <Input
            value={miniMessage}
            onChange={(e) => setMiniMessage(e.target.value)}
            placeholder="Quick message..."
            className="text-xs h-8 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleMiniSend();
              }
            }}
          />
          <Button onClick={handleMiniSend} size="sm" className="w-8 h-8 p-0">
            <Send size={12} />
          </Button>
        </div>
        {state.voiceEnabled && (
          <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground">
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

// ... (keyboard hook unchanged, but remove styles as CSS is in index.css)

// Keyboard shortcuts handler
export function useMiniWidgetKeyboard() {
  const { maximize, minimize } = useWindowControls();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Space to toggle mini/full
      if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
        event.preventDefault();
        maximize(); // TODO: Add toggle logic based on current state
      }

      // Escape to minimize
      if (event.code === 'Escape') {
        minimize();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [maximize, minimize]);
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