import { app, BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import waitOn from 'wait-on';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    show: false, // ウィンドウを即表示せず、準備ができるまで待ちます
    webPreferences: {
      nodeIntegration: false, // セキュリティ向上のために false に
      contextIsolation: true,  // セキュリティ向上のために true に
      webSecurity: false,      // CORSエラーを回避
      preload: path.join(__dirname, 'preload.js'), // もしプリロードスクリプトがあれば
      devTools: false       // 開発者モードを表示させない
    },
    transparent: true,   // ウィンドウを透明にする
    // frame: false,     // フレームをなくす
    // resizable: false,    // 画面の大きさを変えさせない
    hasShadow: false,    // ウィンドウに影をつけない
  });

  if (isDev) {
    // 開発モードの場合、ローカルサーバーが準備できるのを待ちます
    await waitOn({ resources: ['http://localhost:3000'] });
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // 本番モードの場合、ファイルから読み込みます
    mainWindow.loadFile('path/to/your/production/index.html');
  }

  // 'ready-to-show' イベントが発火したらウィンドウを表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  });
}

app.on('ready', createWindow);
