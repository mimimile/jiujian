import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { JiuJianApi, RunRequest, RunId, ClaudeEvent, Market } from '@shared/types'

// 只暴露一个最小、有界、强类型的 window.api。
// 绝不暴露 ipcRenderer / fs / child_process 给渲染层。
const api: JiuJianApi = {
  system: {
    detect: () => ipcRenderer.invoke(IPC.SYSTEM_DETECT),
    setBackgroundMode: (enabled: boolean) => ipcRenderer.invoke(IPC.SYSTEM_SET_BG, enabled),
    getBackgroundMode: () => ipcRenderer.invoke(IPC.SYSTEM_GET_BG),
    onTriggerRecap: (cb: () => void) => {
      const listener = (): void => cb()
      ipcRenderer.on(IPC.SYSTEM_TRIGGER_RECAP, listener)
      return () => {
        ipcRenderer.removeListener(IPC.SYSTEM_TRIGGER_RECAP, listener)
      }
    }
  },
  claude: {
    run: (req: RunRequest) => ipcRenderer.invoke(IPC.CLAUDE_RUN, req),
    recap: (items: Array<{ symbol: string; market: Market }>) =>
      ipcRenderer.invoke(IPC.CLAUDE_RECAP, { items }),
    cancel: (runId: RunId) => ipcRenderer.invoke(IPC.CLAUDE_CANCEL, { runId }),
    onEvent: (cb: (e: ClaudeEvent) => void) => {
      const listener = (_event: unknown, e: ClaudeEvent): void => cb(e)
      ipcRenderer.on(IPC.CLAUDE_EVENT, listener)
      return () => {
        ipcRenderer.removeListener(IPC.CLAUDE_EVENT, listener)
      }
    }
  },
  stock: {
    kline: (req: { symbol: string; market: Market }) => ipcRenderer.invoke(IPC.STOCK_KLINE, req),
    quote: (req: { symbol: string; market: Market }) => ipcRenderer.invoke(IPC.STOCK_QUOTE, req)
  }
}

contextBridge.exposeInMainWorld('api', api)
