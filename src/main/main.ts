import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { registerIpc } from './ipc/register';

const isDev = !app.isPackaged;

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1280,
    minHeight: 800,
    backgroundColor: '#edf1f5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    await mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
};

app.whenReady().then(async () => {
  registerIpc();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
