import type { BrowserWindow } from 'electron'
import type { AuthProvider } from '../services/auth/auth-provider'
import type { ClaudeOrchestrator } from '../services/claude-orchestrator'
import { registerSystemHandlers } from './system.handlers'
import { registerClaudeHandlers } from './claude.handlers'
import { registerStockHandlers } from './stock.handlers'

export interface IpcDeps {
  provider: AuthProvider
  orchestrator: ClaudeOrchestrator
  getMainWindow: () => BrowserWindow | null
  setBackgroundMode: (enabled: boolean) => boolean
  getBackgroundMode: () => boolean
}

export function registerIpc(deps: IpcDeps): void {
  registerSystemHandlers(deps)
  registerClaudeHandlers(deps)
  registerStockHandlers()
}
