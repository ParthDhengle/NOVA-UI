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
    backgroundColor: '#05060A', // Solid fallback to fix black box on Windows
  });

  // Load URL in dev, file in prod (fixes blank window)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide on start, show mini first
  mainWindow.hide();

  // Auto-open DevTools only in dev, with error handling (fixes crash)
  if (process.env.NODE_ENV === 'development') {
    try {
      mainWindow.webContents.openDevTools({ mode: 'detach' }); // Detach to avoid crash
    } catch (err) {
      console.warn('DevTools open failed:', err);
    }
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
    width: 280, // Fixed: Smaller phone-like rect (was 400x600, now compact)
    height: 400,
    frame: false,
    transparent: true, // Glass, but solid bg fallback
    alwaysOnTop: true, // Stays on top
    skipTaskbar: true, // No taskbar
    resizable: false, // Fixed for mini
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#05060A', // Solid fallback to fix black/overlap on Windows
  });

  // Load with mini mode (dev URL, prod file + global flag)
  if (process.env.NODE_ENV === 'development') {
    miniWindow.loadURL('http://localhost:8080?mini=true');
  } else {
    miniWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    // Fixed: Set global flag instead of hacky location.search (avoids crash)
    miniWindow.webContents.executeJavaScript(`
      window.isMiniMode = true;
      document.documentElement.setAttribute('data-mini', 'true');
    `);
  }

  // Conditional DevTools (fixes crash)
  if (process.env.NODE_ENV === 'development') {
    try {
      miniWindow.webContents.openDevTools({ mode: 'detach' });
    } catch (err) {
      console.warn('Mini DevTools open failed:', err);
    }
  }

  // Draggable: CSS handles it (no setIgnoreMouseEvents needed for frameless)
  miniWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      miniWindow.webContents.send('minimize-widget');
    }
  });

  // Error handling for load (prevents crash)
  miniWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Mini load failed:', errorDescription);
  });
}

// IPC (fixed on/send mismatch from previous)
ipcMain.handle('requestExpand', () => { // Fixed: handle for invoke
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

// Fixed: Use ipcMain.on for send events (matches preload)
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
  app.quit(); // Fixed: app.quit() instead of mainWindow.close() for full quit
});

// ... (voice stub unchanged)

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