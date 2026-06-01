import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { klineRequestSchema } from '@shared/schemas'
import { fetchKline } from '../services/stock-data'
import { isValidSender } from './validate'

export function registerStockHandlers(): void {
  ipcMain.handle(IPC.STOCK_KLINE, async (event, payload: unknown) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    const { symbol, market } = klineRequestSchema.parse(payload)
    return fetchKline(symbol, market)
  })
}
