import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { klineRequestSchema, quoteRequestSchema } from '@shared/schemas'
import { fetchKline, fetchQuote } from '../services/stock-data'
import { isValidSender } from './validate'

export function registerStockHandlers(): void {
  ipcMain.handle(IPC.STOCK_KLINE, async (event, payload: unknown) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    const { symbol, market } = klineRequestSchema.parse(payload)
    return fetchKline(symbol, market)
  })

  ipcMain.handle(IPC.STOCK_QUOTE, async (event, payload: unknown) => {
    if (!isValidSender(event)) throw new Error('invalid sender')
    const { symbol, market } = quoteRequestSchema.parse(payload)
    return fetchQuote(symbol, market)
  })
}
