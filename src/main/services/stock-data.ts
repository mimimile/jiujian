import { StockSDK } from 'stock-sdk'
import type { Candle, Market } from '@shared/types'

let sdk: StockSDK | null = null

function getSdk(): StockSDK {
  if (!sdk) sdk = new StockSDK()
  return sdk
}

interface RawKline {
  timestamp: number
  open: number | null
  high: number | null
  low: number | null
  close: number | null
  volume: number | null
}

function toCandle(k: RawKline): Candle | null {
  if (k.open == null || k.high == null || k.low == null || k.close == null) return null
  if (!Number.isFinite(k.timestamp)) return null
  return {
    timestamp: k.timestamp,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume ?? 0
  }
}

/**
 * 图表数据：main 进程直接用核心 stock-sdk 拉日K（快/解耦/不烧 Agent SDK 额度）。
 * 默认前复权(qfq)、日线。FUND（场内 ETF，代码同 A 股）走 A 股 K线接口。
 */
export async function fetchKline(symbol: string, market: Market): Promise<Candle[]> {
  const client = getSdk()
  const code = symbol.trim()
  let raw: RawKline[]
  switch (market) {
    case 'HK':
      raw = await client.getHKHistoryKline(code)
      break
    case 'US':
      raw = await client.getUSHistoryKline(code)
      break
    case 'A':
    case 'FUND':
    default:
      raw = await client.getHistoryKline(code)
      break
  }
  return raw.map(toCandle).filter((c): c is Candle => c !== null)
}
