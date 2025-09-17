import { useEffect, useState, useCallback } from 'react';
import type {
  AgentOp,
  SchedulerTask,
  ChatSession,
  ChatMessage,
  Integration,
  NovaRole
} from '@/api/types';
/**
 * React hook wrapper for Electron API interactions
 * Provides typed access to window.api methods with React state management
 */
export const useElectronApi = () => {
  const [isElectron] = useState(() => typeof window !== 'undefined' && window.api);
  // Fallback for when running in browser (development)
  const mockApi = {
    requestExpand: () => console.log('Mock: requestExpand'),
    requestMinimize: () => console.log('Mock: requestMinimize'),
    setAlwaysOnTop: (flag: boolean) => console.log('Mock: setAlwaysOnTop', flag),
    windowMinimize: () => console.log('Mock: windowMinimize'), // Fixed: Added missing mock
    windowMaximize: () => console.log('Mock: windowMaximize'), // Fixed: Added missing mock
    windowClose: () => console.log('Mock: windowClose'), // Fixed: Added missing mock
    transcribeStart: async (sessionId: string) => console.log('Mock: transcribeStart', sessionId),
    transcribeStop: async (sessionId: string) => console.log('Mock: transcribeStop', sessionId),
    transcribeStream: (sessionId: string, cb: (text: string, partial: boolean) => void) => { // Fixed: Specific cb type
      console.log('Mock: transcribeStream', sessionId);
      // Simulate streaming transcript
      setTimeout(() => cb('Hello, this is a mock transcript...', true), 1000);
      setTimeout(() => cb('Hello, this is a mock transcript for testing.', false), 2000);
    },
    onMessageStream: (cb: (message: ChatMessage) => void) => { // Fixed: Specific cb type
      console.log('Mock: onMessageStream');
      return () => {};
    },
    onAgentOpsUpdate: (cb: (ops: AgentOp[]) => void) => { // Fixed: Specific cb type
      console.log('Mock: onAgentOpsUpdate');
      return () => {};
    },
    executeAction: async (action: { type: string; payload?: unknown }) => ({ ok: true }), // Fixed: payload unknown
    listLocalModels: async () => ['whisper-base', 'whisper-small', 'whisper-medium'],
    speak: async (text: string, voiceId?: string) => console.log('Mock: speak', text, voiceId),
    sendMessage: async (message: string, sessionId?: string) => ({ sessionId: sessionId || 'mock-session' }),
    notify: (title: string, body?: string) => console.log('Mock: notify', title, body),
  };
  const api = isElectron ? window.api : mockApi;
  return {
    api,
    isElectron,
  };
};
/**
 * Hook for managing agent operations state
 */
export const useAgentOps = () => {
  const [operations, setOperations] = useState<AgentOp[]>([]);
  const { api, isElectron } = useElectronApi();
  useEffect(() => {
    if (!isElectron) {
      // Mock data for development
      setOperations([
        {
          id: '1',
          title: 'Analyzing calendar conflicts',
          desc: 'Checking for scheduling conflicts in next week',
          status: 'running',
          progress: 65,
          startTime: Date.now() - 30000,
        },
        {
          id: '2',
          title: 'Email draft preparation',
          desc: 'Preparing response to client inquiry',
          status: 'pending',
          startTime: Date.now() - 5000,
        }
      ]);
      return;
    }
    const unsubscribe = api.onAgentOpsUpdate?.(setOperations);
    return unsubscribe;
  }, [api, isElectron]);
  const cancelOperation = useCallback((id: string) => {
    // TODO: IMPLEMENT IN PRELOAD - api.cancelOperation(id)
    setOperations(ops => ops.filter(op => op.id !== id));
  }, []);
  return {
    operations,
    cancelOperation,
  };
};
/**
 * Hook for managing voice transcription
 */
export const useVoiceTranscription = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPartial, setIsPartial] = useState(false);
  const { api } = useElectronApi();
  const startRecording = useCallback(async () => {
    const sessionId = `voice-${Date.now()}`;
    setIsRecording(true);
    setTranscript('');
   
    try {
      await api.transcribeStart(sessionId);
     
      // Set up streaming transcript
      api.transcribeStream(sessionId, (text: string, partial: boolean) => {
        setTranscript(text);
        setIsPartial(partial);
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  }, [api]);
  const stopRecording = useCallback(async () => {
    const sessionId = `voice-${Date.now()}`;
    setIsRecording(false);
   
    try {
      await api.transcribeStop(sessionId);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [api]);
  return {
    isRecording,
    transcript,
    isPartial,
    startRecording,
    stopRecording,
  };
};
/**
 * Hook for managing window state
 */
export const useWindowControls = () => {
  const { api } = useElectronApi();
  const minimize = useCallback(() => {
    api.windowMinimize?.(); // Fixed: Now safe with mock
  }, [api]);
  const maximize = useCallback(() => {
    api.windowMaximize?.(); // Fixed: Now safe with mock
  }, [api]);
  const close = useCallback(() => {
    api.windowClose?.(); // Fixed: Now safe with mock
  }, [api]);
  // In useWindowControls (replace expand only):
const expand = useCallback(async () => { // FIXED: Make async
  console.log('HOOK: Calling api.requestExpand...'); // Log D
  try {
    await api.requestExpand?.(); // Awaits the Promise
    console.log('HOOK: api.requestExpand succeeded'); // Log E
  } catch (error) {
    console.error('HOOK: api.requestExpand failed:', error); // FIXED: Catch
  }
}, [api]);
  return { minimize, maximize, close, expand };
};