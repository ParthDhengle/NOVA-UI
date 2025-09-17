import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow; // Full chat window
let miniWindow; // Mini widget window
let mainLoaded = false; // FIXED: Track if main is ready
let miniLoaded = false; // FIXED: Track if mini is ready

console.log('MAIN: Starting main process...'); // Log 0: App start

function createMainWindow() {
  console.log('MAIN: Creating main window...'); // Log 1
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
    backgroundColor: 'transparent', // Changed to transparent
  });
  // Load URL in dev, file in prod (fixes blank window)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  // FIXED: Wait for load before hiding (ensures React renders)
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('MAIN: Main window loaded successfully'); // Log 2
    mainLoaded = true;
    // Apply theme (CSS vars for dark cyan)
    mainWindow.webContents.insertCSS(`
      :root {
        --nova-bg: #05060A;
        --nova-cyan: #00B7C7;
        --nova-accent: #007F8A;
        --nova-text: #E6F7F8;
        --nova-muted: #1a2930;
      }
    `);
    // FIXED: Only hide after load (prevents blank show later)
    if (miniLoaded) {
      mainWindow.hide();
      console.log('MAIN: Main hidden after load (mini ready)'); // Log 3
    }
  });
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('MAIN: Main load failed:', code, desc); // FIXED: Surface load errors
  });
  // FIXED: Remove auto DevTools (causes spam)—open manually with Ctrl+Shift+I
}

function createMiniWindow() {
  console.log('MAIN: Creating mini window...'); // Log 4
  miniWindow = new BrowserWindow({
    width: 280,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    minWidth: 200,
    minHeight: 300,
    maxWidth: 400,
    maxHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: 'transparent',
  });
  // Load with mini mode
  if (process.env.NODE_ENV === 'development') {
    miniWindow.loadURL('http://localhost:5173?mini=true');
  } else {
    miniWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    miniWindow.webContents.executeJavaScript(`
      window.isMiniMode = true;
      document.documentElement.setAttribute('data-mini', 'true');
    `);
  }
  // FIXED: Wait for load before showing
  miniWindow.webContents.on('did-finish-load', () => {
    console.log('MAIN: Mini window loaded successfully'); // Log 5
    miniLoaded = true;
    miniWindow.show(); // Show mini after load
    if (mainLoaded) {
      mainWindow.hide();
      console.log('MAIN: Mini shown, main hidden'); // Log 6
    }
  });
  miniWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('MAIN: Mini load failed:', code, desc); // FIXED: Surface errors
  });
  // FIXED: Remove auto DevTools
  miniWindow.on('blur', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      miniWindow.webContents.send('minimize-widget');
    }
  });
}

// FIXED: IPC with logs and load checks
ipcMain.handle('requestExpand', async () => {
  console.log('MAIN: IPC requestExpand received!'); // Log 7: Confirms handler fires
  if (!mainLoaded) {
    console.warn('MAIN: Main not loaded yet—waiting...');
    await new Promise(resolve => mainWindow.webContents.once('did-finish-load', resolve));
  }
  if (miniWindow && miniWindow.isVisible()) {
    miniWindow.hide();
    console.log('MAIN: Mini hidden'); // Log 8
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(false);
    // FIXED: Force reload if blank (React render fix)
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.reloadIgnoringCache();
      console.log('MAIN: Main reloaded (dev hot-fix)'); // Log 9
    }
    console.log('MAIN: Main shown and focused!'); // Log 10: Success
  }
  return { success: true }; // FIXED: Return value for renderer await
});

ipcMain.handle('requestMinimize', async () => {
  console.log('MAIN: IPC requestMinimize received!');
  if (!miniLoaded) {
    await new Promise(resolve => miniWindow.webContents.once('did-finish-load', resolve));
  }
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
    console.log('MAIN: Main hidden');
  }
  if (miniWindow) {
    miniWindow.show();
    miniWindow.setAlwaysOnTop(true);
    console.log('MAIN: Mini shown');
  }
  return { success: true };
});

ipcMain.handle('setAlwaysOnTop', (event, flag) => {
  if (mainWindow) mainWindow.setAlwaysOnTop(flag);
  if (miniWindow) miniWindow.setAlwaysOnTop(flag);
});

// Rest unchanged...
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
  app.quit();
});

app.whenReady().then(() => {
  console.log('MAIN: App ready—creating windows'); // Log 11
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