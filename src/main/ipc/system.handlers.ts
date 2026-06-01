import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { IpcDeps } from './index'
import { isValidSender } from './validate'

export function registerSystemHandlers({ provider }: IpcDeps): void {
  ipcMain.handle(IPC.SYSTEM_DETECT, async (event) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    return provider.detect()
  })
}
