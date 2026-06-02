import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { IpcDeps } from './index'
import { isValidSender } from './validate'

export function registerSystemHandlers({
  provider,
  setBackgroundMode,
  getBackgroundMode
}: IpcDeps): void {
  ipcMain.handle(IPC.SYSTEM_DETECT, async (event) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    return provider.detect()
  })

  ipcMain.handle(IPC.SYSTEM_GET_BG, async (event) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    return getBackgroundMode()
  })

  ipcMain.handle(IPC.SYSTEM_SET_BG, async (event, enabled: unknown) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    return setBackgroundMode(Boolean(enabled))
  })
}
