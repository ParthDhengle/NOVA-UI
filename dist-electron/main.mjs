import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow; // Full chat window
let miniWindow; // Mini widget window

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless for custom titlebar
    transparent: true, // For glassmorphism
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#05060A', // Your black bg
  });

  // Load your React build
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Hide on start, show mini first
  mainWindow.hide();

  // Auto-open DevTools for debugging (remove in production)
  mainWindow.webContents.openDevTools();

  // Apply theme (CSS vars for dark cyan)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      :root {
        --nova-bg: #05060A;
        --nova-cyan: #00B7C7;
        --nova-accent: #007F8A;
        --nova-text: #E6F7F8;
        --nova-muted: #1a2930;
      }
    `);
  });
}

function createMiniWindow() {
  miniWindow = new BrowserWindow({
    width: 100,
    height: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true, // Stays on top of other apps
    skipTaskbar: true, // No taskbar icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#05060A',
  });

  // Load MiniWidget as standalone (FIX: Use miniWindow.loadFile, add ?mini=true)
  miniWindow.loadFile(path.join(__dirname, '../dist/index.html?mini=true'));

  // Auto-open DevTools for debugging (remove in production)
  miniWindow.webContents.openDevTools();

  // Draggable: Make whole window draggable
  miniWindow.setIgnoreMouseEvents(false, { forward: false });

  // Click-outside to minimize (shrink to mini)
  miniWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      miniWindow.webContents.send('minimize-widget'); // Trigger UI shrink
    }
  });
}

// Window Controls IPC (from your window.api)
ipcMain.handle('requestExpand', () => {
  if (miniWindow) miniWindow.hide();
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(false);
  }
});

ipcMain.handle('requestMinimize', () => {
  if (mainWindow) {
    mainWindow.hide();
    mainWindow.setAlwaysOnTop(false);
  }
  if (miniWindow) {
    miniWindow.show();
    miniWindow.setAlwaysOnTop(true);
  }
});

ipcMain.handle('setAlwaysOnTop', (event, flag) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(flag);
  if (miniWindow) miniWindow.setAlwaysOnTop(flag);
});

// Custom titlebar IPC (minimize, maximize, close)
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.handle('window-maximize', () => {
  if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('window-close', () => {
  app.quit();
});

// Voice (local Whisper via Python - stub for now)
ipcMain.handle('transcribeStart', async (event, sessionId) => {
  // Spawn Python Whisper script (add your logic here)
  const pythonProcess = spawn('python', ['path/to/your/whisper_script.py', sessionId]);
  // Handle stdout for streaming...
});

// Add other ipcMain.handle for your window.api methods (e.g., speak, executeAction)

app.whenReady().then(() => {
  createMainWindow();
  createMiniWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createMiniWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});