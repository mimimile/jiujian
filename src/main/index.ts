import { app, BrowserWindow } from 'electron'
import { fixLoginPath } from './services/path-resolver'
import { SubscriptionCliProvider } from './services/auth/subscription-cli-provider'
import { ClaudeOrchestrator } from './services/claude-orchestrator'
import { createWindow } from './window'
import { registerIpc } from './ipc'

let mainWindow: BrowserWindow | null = null

// D10：当前唯一鉴权实现 = 订阅 CLI。未来加 API key/Agent SDK 只需换/加 provider。
const provider = new SubscriptionCliProvider()
const orchestrator = new ClaudeOrchestrator(provider)

app.whenReady().then(async () => {
  // 第一件事：修复 GUI 应用的 PATH（macOS/Linux），保证后续能 spawn 到用户的 claude
  await fixLoginPath()

  registerIpc({ provider, orchestrator, getMainWindow: () => mainWindow })

  mainWindow = createWindow()
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
      mainWindow.on('closed', () => {
        mainWindow = null
      })
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 退出前杀掉所有 claude / MCP 子进程，避免孤儿进程
app.on('before-quit', () => {
  orchestrator.killAll()
})
