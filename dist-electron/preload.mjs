import { contextBridge, ipcRenderer } from 'electron';

console.log('PRELOAD: Starting preload script...'); // Log 1: Confirms preload loads

contextBridge.exposeInMainWorld('api', {
  requestExpand: async () => {
    console.log('RENDERER: Calling requestExpand via IPC...'); // Log 2: Renderer side invoke start
    try {
      const result = await ipcRenderer.invoke('requestExpand');
      console.log('RENDERER: requestExpand succeeded:', result); // Log 3: Success
      return result;
    } catch (error) {
      console.error('RENDERER: requestExpand failed:', error); // Log 4: Catches silent errors (e.g., no handler)
      throw error;
    }
  },
  requestMinimize: async () => {
    console.log('RENDERER: Calling requestMinimize...');
    try {
      const result = await ipcRenderer.invoke('requestMinimize');
      console.log('RENDERER: requestMinimize succeeded:', result);
      return result;
    } catch (error) {
      console.error('RENDERER: requestMinimize failed:', error);
      throw error;
    }
  },
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('setAlwaysOnTop', flag),
  windowMinimize: () => ipcRenderer.send("window:minimize"),
  windowMaximize: () => ipcRenderer.send("window:maximize"),
  windowClose: () => ipcRenderer.send("window:close"),
  transcribeStart: (sessionId) => ipcRenderer.invoke('transcribeStart', sessionId),
  transcribeStop: (sessionId) => ipcRenderer.invoke('transcribeStop', sessionId),
  transcribeStream: (sessionId, cb) => {
    ipcRenderer.on(`transcribe-stream-${sessionId}`, (event, text, partial) => cb(text, partial));
    return () => ipcRenderer.removeAllListeners(`transcribe-stream-${sessionId}`);
  },
  listLocalModels: () => ipcRenderer.invoke('listLocalModels'),
  speak: (text, voiceId) => ipcRenderer.invoke('speak', text, voiceId),
  sendMessage: (message, sessionId) => ipcRenderer.invoke('sendMessage', message, sessionId),
  onMessageStream: (cb) => {
    ipcRenderer.on('message-stream', (event, message) => cb(message));
    return () => ipcRenderer.removeAllListeners('message-stream');
  },
  executeAction: (action) => ipcRenderer.invoke('executeAction', action),
  onAgentOpsUpdate: (cb) => {
    ipcRenderer.on('agent-ops-update', (event, ops) => cb(ops));
    return () => ipcRenderer.removeAllListeners('agent-ops-update');
  },
  createTask: (task) => ipcRenderer.invoke('createTask', task),
  updateTask: (id, updates) => ipcRenderer.invoke('updateTask', id, updates),
  deleteTask: (id) => ipcRenderer.invoke('deleteTask', id),
  getTasks: () => ipcRenderer.invoke('getTasks'),
  getChatSessions: () => ipcRenderer.invoke('getChatSessions'),
  getChatSession: (id) => ipcRenderer.invoke('getChatSession', id),
  deleteChatSession: (id) => ipcRenderer.invoke('deleteChatSession', id),
  searchChats: (query) => ipcRenderer.invoke('searchChats', query),
  openExternalAuth: (service) => ipcRenderer.invoke('openExternalAuth', service),
  enableIntegration: (service, credentials) => ipcRenderer.invoke('enableIntegration', service, credentials),
  getIntegrations: () => ipcRenderer.invoke('getIntegrations'),
  exportDashboardPDF: (payload) => ipcRenderer.invoke('exportDashboardPDF', payload),
  getUserPreferences: () => ipcRenderer.invoke('getUserPreferences'),
  updateUserPreferences: (prefs) => ipcRenderer.invoke('updateUserPreferences', prefs),
  notify: (title, body) => ipcRenderer.invoke('notify', title, body),
  onThemeChange: (cb) => {
    ipcRenderer.on('theme-change', (event, theme) => cb(theme));
    return () => ipcRenderer.removeAllListeners('theme-change');
  },
  getAppVersion: () => ipcRenderer.invoke('getAppVersion'),
});

console.log('PRELOAD: contextBridge exposed window.api successfully'); // Log 5: Confirms exposure