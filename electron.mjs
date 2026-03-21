import http from 'http'
import net from 'net'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import { app, BrowserWindow, ipcMain, screen } from 'electron'
import isDev from 'electron-is-dev'
import next from 'next'
import waitOn from 'wait-on'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3000)
const HOST = '127.0.0.1'
const DISABLE_GPU = process.env.AITUBERKIT_DISABLE_GPU === '1'
const WEB_BOOT_TIMEOUT_MS = 120000
const PAGE_LOAD_TIMEOUT_MS = 45000
const RENDERER_RECOVERY_LIMIT = 1
const FALLBACK_LOG_PATH = path.join(
  os.homedir(),
  'AppData',
  'Roaming',
  'aituber-kit',
  'startup.log'
)

let mainWindow
let mobileWindow
let webServer
let splashWindow
let pendingSecondInstanceFocus = false
let launchedAppUrl = ''
let rendererRecoveryCount = 0

if (DISABLE_GPU) {
  app.disableHardwareAcceleration()
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
  process.exit(0)
}

function appendStartupLog(message) {
  try {
    const line = `[${new Date().toISOString()}] ${message}\n`
    const userDataPath = app.isReady() ? app.getPath('userData') : ''
    const logPath = userDataPath
      ? path.join(userDataPath, 'startup.log')
      : FALLBACK_LOG_PATH
    fs.mkdirSync(path.dirname(logPath), { recursive: true })
    fs.appendFileSync(logPath, line, 'utf8')
  } catch {
    // Keep startup resilient even when logging fails.
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getStartupLogPath() {
  const userDataPath = app.isReady() ? app.getPath('userData') : ''
  return userDataPath
    ? path.join(userDataPath, 'startup.log')
    : FALLBACK_LOG_PATH
}

function getStartupErrorHtml(message) {
  const safeMessage = escapeHtml(message)
  const safeLogPath = escapeHtml(getStartupLogPath())
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        background: #121212;
        color: #f5f5f5;
        font-family: "Segoe UI", Arial, sans-serif;
        display: grid;
        place-items: center;
      }
      .panel {
        width: min(760px, calc(100vw - 48px));
        background: #1b1b1b;
        border: 1px solid #333;
        border-radius: 10px;
        padding: 20px;
        box-sizing: border-box;
      }
      .title { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
      .desc { opacity: 0.9; margin-bottom: 12px; line-height: 1.5; }
      .code {
        font-family: Consolas, "Courier New", monospace;
        background: #101010;
        border: 1px solid #2f2f2f;
        border-radius: 8px;
        padding: 10px;
        white-space: pre-wrap;
        word-break: break-word;
        margin-bottom: 12px;
      }
      .hint { font-size: 12px; opacity: 0.75; }
    </style>
  </head>
  <body>
    <div class="panel">
      <div class="title">AITuberKit failed to start</div>
      <div class="desc">The app detected a startup error and stopped retrying to avoid a frozen window.</div>
      <div class="code">${safeMessage}</div>
      <div class="hint">Startup log: ${safeLogPath}</div>
    </div>
  </body>
</html>`
}

function showFatalStartupWindow(error) {
  const message =
    error && typeof error === 'object' && 'stack' in error
      ? String(error.stack)
      : String(error)
  appendStartupLog(`Showing fatal startup window: ${message}`)
  closeSplashWindow()
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = new BrowserWindow({
      width: 900,
      height: 640,
      center: true,
      backgroundColor: '#111111',
      autoHideMenuBar: true,
      webPreferences: {
        sandbox: true,
      },
    })
  }
  mainWindow.loadURL(
    `data:text/html;charset=UTF-8,${encodeURIComponent(
      getStartupErrorHtml(message)
    )}`
  )
  mainWindow.show()
  mainWindow.focus()
}

async function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timeoutId
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

function ensureProductionBuildExists() {
  if (isDev) {
    return
  }
  const buildIdPath = path.join(__dirname, '.next', 'BUILD_ID')
  if (!fs.existsSync(buildIdPath)) {
    throw new Error(
      `Missing production build file: ${buildIdPath}. Rebuild desktop package with "npm run build" before packaging.`
    )
  }
}

function createSplashWindow() {
  if (splashWindow || !app.isReady()) {
    return
  }

  splashWindow = new BrowserWindow({
    width: 420,
    height: 240,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    show: true,
    center: true,
    alwaysOnTop: true,
    backgroundColor: '#111111',
    webPreferences: {
      sandbox: true,
    },
  })

  const splashHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        height: 100vh;
        display: grid;
        place-items: center;
        background: #111111;
        color: #f5f5f5;
        font-family: "Segoe UI", Arial, sans-serif;
      }
      .box { text-align: center; }
      .title { font-size: 22px; font-weight: 600; letter-spacing: 0.02em; margin-bottom: 8px; }
      .desc { font-size: 13px; opacity: 0.8; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="title">AITuberKit</div>
      <div class="desc">Launching... please wait</div>
    </div>
  </body>
</html>`

  splashWindow.loadURL(
    `data:text/html;charset=UTF-8,${encodeURIComponent(splashHtml)}`
  )
  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

function closeSplashWindow() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
  }
  splashWindow = null
}

function buildMobileUrl(baseUrl) {
  const url = new URL(baseUrl)
  url.searchParams.set('layout', 'mobile-window')
  return url.toString()
}

function createMobileWindow() {
  if (!launchedAppUrl) {
    throw new Error('Cannot open mobile window before app URL is ready')
  }

  if (mobileWindow && !mobileWindow.isDestroyed()) {
    mobileWindow.show()
    mobileWindow.focus()
    return mobileWindow
  }

  mobileWindow = new BrowserWindow({
    width: 430,
    height: 860,
    minWidth: 360,
    minHeight: 640,
    show: false,
    backgroundColor: '#00000000',
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    movable: true,
    resizable: true,
    title: 'AITuberKit Mobile',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev,
    },
  })

  mobileWindow.on('closed', () => {
    mobileWindow = null
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      mainWindow.focus()
      appendStartupLog('Mobile window closed; restored main window')
    }
  })

  mobileWindow
    .loadURL(buildMobileUrl(launchedAppUrl))
    .then(() => appendStartupLog('Opened mobile window'))
    .catch((error) =>
      appendStartupLog(
        `Failed to open mobile window: ${error.stack || error.message}`
      )
    )

  mobileWindow.once('ready-to-show', () => {
    mobileWindow?.show()
  })

  return mobileWindow
}

function registerIpcHandlers() {
  ipcMain.handle('window:open-mobile', () => {
    createMobileWindow()
    return { ok: true }
  })

  ipcMain.handle('window:close-mobile', () => {
    if (mobileWindow && !mobileWindow.isDestroyed()) {
      mobileWindow.close()
    }
    return { ok: true }
  })

  ipcMain.handle('window:focus-main', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()
    }
    return { ok: true }
  })

  ipcMain.handle('window:hide-main', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide()
    }
    return { ok: true }
  })

  ipcMain.handle('window:get-mobile-bounds', () => {
    const targetWindow =
      mobileWindow && !mobileWindow.isDestroyed() ? mobileWindow : null
    if (!targetWindow) {
      return { ok: false }
    }
    const bounds = targetWindow.getBounds()
    return { ok: true, bounds }
  })

  ipcMain.handle('window:set-mobile-position', (_event, x, y) => {
    const targetWindow =
      mobileWindow && !mobileWindow.isDestroyed() ? mobileWindow : null
    if (!targetWindow) {
      return { ok: false }
    }
    targetWindow.setPosition(Math.round(x), Math.round(y))
    return { ok: true }
  })
}

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
    tester.once('error', () => resolve(false))
    tester.once('listening', () => {
      tester.close(() => resolve(true))
    })
    tester.listen(port, HOST)
  })
}

async function resolvePort() {
  if (isDev) {
    return PORT
  }

  if (process.env.PORT) {
    return PORT
  }

  if (await isPortAvailable(PORT)) {
    return PORT
  }

  for (let candidate = PORT + 1; candidate <= PORT + 20; candidate += 1) {
    if (await isPortAvailable(candidate)) {
      return candidate
    }
  }

  throw new Error('No available port found for desktop web server')
}

async function startWebApp() {
  const resolvedPort = await resolvePort()
  const url = `http://${HOST}:${resolvedPort}`
  appendStartupLog(`Resolved web server port: ${resolvedPort}`)

  if (isDev) {
    const devServerResource = `tcp:${HOST}:${resolvedPort}`
    appendStartupLog(`Waiting for dev server: ${devServerResource}`)
    await waitOn({
      resources: [devServerResource],
      timeout: 45000,
      interval: 250,
      window: 1000,
    })
    return url
  }

  ensureProductionBuildExists()

  const nextApp = next({
    dev: false,
    dir: __dirname,
  })
  const handle = nextApp.getRequestHandler()

  await nextApp.prepare()

  webServer = http.createServer((req, res) => handle(req, res))
  await new Promise((resolve, reject) => {
    webServer.once('error', reject)
    webServer.listen(resolvedPort, HOST, () => resolve())
  })

  return url
}

async function startWebAppWithRetry(maxAttempts = isDev ? 1 : 3) {
  let lastError

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      appendStartupLog(`Web startup attempt ${attempt}/${maxAttempts}`)
      return await startWebApp()
    } catch (error) {
      lastError = error
      appendStartupLog(
        `Web startup attempt failed: ${error.stack || error.message}`
      )
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
    }
  }

  throw lastError
}

async function createWindow() {
  appendStartupLog('Starting desktop bootstrap')
  createSplashWindow()
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width,
    height,
    center: true,
    show: false,
    backgroundColor: '#111111',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev,
    },
  })

  rendererRecoveryCount = 0
  mainWindow.on('did-fail-load', (_event, errorCode, errorDescription) => {
    appendStartupLog(`did-fail-load: ${errorCode} ${errorDescription}`)
  })

  mainWindow.on('unresponsive', () => {
    appendStartupLog('mainWindow unresponsive event')
    if (rendererRecoveryCount < RENDERER_RECOVERY_LIMIT) {
      rendererRecoveryCount += 1
      appendStartupLog('Attempting renderer recovery via reloadIgnoringCache')
      mainWindow.webContents.reloadIgnoringCache()
      return
    }
    showFatalStartupWindow(
      new Error(
        'Renderer became unresponsive repeatedly. Try launching again with AITUBERKIT_DISABLE_GPU=1 if this persists.'
      )
    )
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) =>
    appendStartupLog(`render-process-gone: ${details.reason}`)
  )
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (rendererRecoveryCount < RENDERER_RECOVERY_LIMIT) {
      rendererRecoveryCount += 1
      appendStartupLog('Attempting renderer recovery after render-process-gone')
      mainWindow.webContents.reloadIgnoringCache()
      return
    }
    showFatalStartupWindow(
      new Error(`Renderer process exited (${details.reason}).`)
    )
  })

  let hasShownMainWindow = false
  const revealMainWindow = (reason) => {
    if (!mainWindow || mainWindow.isDestroyed() || hasShownMainWindow) {
      return
    }
    hasShownMainWindow = true
    closeSplashWindow()
    mainWindow.show()
    appendStartupLog(`Window shown via ${reason}`)
    if (pendingSecondInstanceFocus) {
      pendingSecondInstanceFocus = false
      mainWindow.focus()
    }
    if (isDev && !mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  }

  mainWindow.once('ready-to-show', () => {
    revealMainWindow('ready-to-show')
  })

  mainWindow.webContents.once('did-finish-load', () => {
    revealMainWindow('did-finish-load')
  })

  const appUrl = await withTimeout(
    startWebAppWithRetry(),
    WEB_BOOT_TIMEOUT_MS,
    `Timed out starting local web app after ${WEB_BOOT_TIMEOUT_MS}ms`
  )
  launchedAppUrl = appUrl

  await withTimeout(
    mainWindow.loadURL(appUrl),
    PAGE_LOAD_TIMEOUT_MS,
    `Timed out loading ${appUrl} after ${PAGE_LOAD_TIMEOUT_MS}ms`
  )
  appendStartupLog(`Loaded URL: ${appUrl}`)

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !hasShownMainWindow) {
      appendStartupLog('Window fallback after timeout')
      revealMainWindow('timeout')
    }
  }, 7000)
}

app
  .whenReady()
  .then(createWindow)
  .catch((error) => {
    appendStartupLog(`Startup fatal error: ${error.stack || error.message}`)
    console.error('Failed to start desktop app:', error)
    showFatalStartupWindow(error)
  })

app.whenReady().then(registerIpcHandlers)

app.on('second-instance', () => {
  appendStartupLog('second-instance detected; focusing existing window')
  if (!mainWindow) {
    pendingSecondInstanceFocus = true
    if (app.isReady()) {
      createSplashWindow()
    }
    return
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }
  mainWindow.show()
  mainWindow.focus()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('before-quit', async () => {
  appendStartupLog('before-quit')
  closeSplashWindow()
  if (!webServer) {
    return
  }
  await new Promise((resolve) => webServer.close(() => resolve()))
})

process.on('uncaughtException', (error) => {
  appendStartupLog(`uncaughtException: ${error.stack || error.message}`)
})

process.on('unhandledRejection', (error) => {
  appendStartupLog(`unhandledRejection: ${String(error)}`)
})
