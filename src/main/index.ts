import { app, BrowserWindow } from 'electron'
import { fixLoginPath } from './services/path-resolver'
import { SubscriptionCliProvider } from './services/auth/subscription-cli-provider'
import { ClaudeOrchestrator } from './services/claude-orchestrator'
import { createWindow } from './window'
import { registerIpc } from './ipc'
import { maybeRunE2E } from './e2e'
import { setupTray } from './tray'
import { IPC } from '@shared/ipc-channels'

let mainWindow: BrowserWindow | null = null
let isQuitting = false
let backgroundMode = false

// D10：当前唯一鉴权实现 = 订阅 CLI。未来加 API key/Agent SDK 只需换/加 provider。
const provider = new SubscriptionCliProvider()
const orchestrator = new ClaudeOrchestrator(provider)

function setBackgroundMode(enabled: boolean): boolean {
  backgroundMode = enabled
  try {
    // 后台常驻 = 开机自启（隐藏启动）。关窗缩 tray 由 close 处理。
    app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: enabled })
  } catch {
    /* 平台不支持时忽略 */
  }
  return backgroundMode
}

function bindWindow(win: BrowserWindow): void {
  win.on('closed', () => {
    mainWindow = null
  })
  // 后台常驻：关窗 = 缩到 tray（不退出），保证定时复盘继续跑
  win.on('close', (e) => {
    if (backgroundMode && !isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })
}

function triggerRecap(): void {
  mainWindow?.show()
  mainWindow?.webContents.send(IPC.SYSTEM_TRIGGER_RECAP)
}

function quitApp(): void {
  isQuitting = true
  app.quit()
}

app.whenReady().then(async () => {
  // 第一件事：修复 GUI 应用的 PATH（macOS/Linux），保证后续能 spawn 到用户的 claude
  await fixLoginPath()

  const login = app.getLoginItemSettings()
  backgroundMode = login.openAtLogin

  registerIpc({
    provider,
    orchestrator,
    getMainWindow: () => mainWindow,
    setBackgroundMode,
    getBackgroundMode: () => backgroundMode
  })

  const startHidden = backgroundMode && login.wasOpenedAsHidden
  mainWindow = createWindow(startHidden)
  bindWindow(mainWindow)
  maybeRunE2E(mainWindow)

  setupTray(() => mainWindow, triggerRecap, quitApp)

  app.on('activate', () => {
    if (mainWindow) {
      mainWindow.show()
    } else {
      mainWindow = createWindow()
      bindWindow(mainWindow)
    }
  })
})

// 后台常驻时关窗不退出；非常驻按平台默认（macOS 保留，其它退出）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !backgroundMode) app.quit()
})

// 退出前杀掉所有 claude / MCP 子进程，避免孤儿进程
app.on('before-quit', () => {
  isQuitting = true
  orchestrator.killAll()
})
