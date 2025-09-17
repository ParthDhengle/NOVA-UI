const { contextBridge, ipcRenderer } = require('electron');

// Expose your typed APIs (match src/api/types.ts)
contextBridge.exposeInMainWorld('api', {
  requestExpand: () => ipcRenderer.invoke('requestExpand'),
  requestMinimize: () => ipcRenderer.invoke('requestMinimize'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('setAlwaysOnTop', flag),
  transcribeStart: (sessionId) => ipcRenderer.invoke('transcribeStart', sessionId),
  // ... Add all other methods from types.ts as ipcRenderer.invoke('methodName', args)
  // For events (on*): Use ipcRenderer.on(channel, cb) and return unsubscribe fn.
});