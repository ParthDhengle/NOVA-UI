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
    resizable: true, // Enable resizing on Windows
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#05060A', // Your black bg
  });

  // Load URL in dev, file in prod (fixes blank window)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide on start, show mini first
  mainWindow.hide();

  // Auto-open DevTools for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

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
    width: 400, // Increased for small chat interface
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true, // Stays on top of other apps
    skipTaskbar: true, // No taskbar icon
    resizable: false, // Fixed size for mini
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#05060A',
  });

  // Load MiniWidget with ?mini=true (URL in dev, file in prod)
  let miniLoadPath;
  if (process.env.NODE_ENV === 'development') {
    miniLoadPath = 'http://localhost:8080?mini=true';
    miniWindow.loadURL(miniLoadPath);
  } else {
    miniLoadPath = path.join(__dirname, '../dist/index.html');
    miniWindow.loadFile(miniLoadPath);
    // Manually set mini mode for prod file load (no query params)
    miniWindow.webContents.executeJavaScript("window.location.search = '?mini=true';");
  }

  // Auto-open DevTools for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    miniWindow.webContents.openDevTools();
  }

  // Draggable: Whole window draggable (CSS handles no-drag for buttons)
  miniWindow.setIgnoreMouseEvents(false, { forward: false });

  // Optional: Blur to hide mini (if you want auto-minimize on click-away)
  miniWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      miniWindow.webContents.send('minimize-widget'); // Trigger UI shrink if needed
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
ipcMain.on("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on("window:close", () => {
  mainWindow?.close();
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