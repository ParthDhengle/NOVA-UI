import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  requestExpand: () => ipcRenderer.invoke('requestExpand'),
  requestMinimize: () => ipcRenderer.invoke('requestMinimize'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('setAlwaysOnTop', flag),
  transcribeStart: (sessionId) => ipcRenderer.invoke('transcribeStart', sessionId),
  // Add other methods from types.ts as needed
});