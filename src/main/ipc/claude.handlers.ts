import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { runRequestSchema, cancelRequestSchema, recapRequestSchema } from '@shared/schemas'
import type { IpcDeps } from './index'
import { isValidSender } from './validate'

export function registerClaudeHandlers({ orchestrator, getMainWindow }: IpcDeps): void {
  ipcMain.handle(IPC.CLAUDE_RUN, async (event, payload: unknown) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    const req = runRequestSchema.parse(payload) // 入参一律 Zod 校验
    const win = getMainWindow()
    if (!win) throw new Error('主窗口不存在')
    const runId = await orchestrator.run(req, win)
    return { runId }
  })

  ipcMain.handle(IPC.CLAUDE_RECAP, async (event, payload: unknown) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    const { items } = recapRequestSchema.parse(payload)
    const win = getMainWindow()
    if (!win) throw new Error('主窗口不存在')
    const runId = await orchestrator.runRecap(items, win)
    return { runId }
  })

  ipcMain.handle(IPC.CLAUDE_CANCEL, async (event, payload: unknown) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    const { runId } = cancelRequestSchema.parse(payload)
    return { ok: orchestrator.cancel(runId) }
  })
}
