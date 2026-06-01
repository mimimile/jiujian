import { StockSDK } from 'stock-sdk'
import type { Candle, Market, Quote } from '@shared/types'

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

/**
 * 实时行情（行情头）。A/HK/US 用各自 quote 接口；基金用 getFundQuotes（净值 nav 当价、按 change 推涨跌幅）。
 */
export async function fetchQuote(symbol: string, market: Market): Promise<Quote | null> {
  const client = getSdk()
  const code = symbol.trim()
  if (market === 'FUND') {
    const q = (await client.getFundQuotes([code]))[0]
    if (!q) return null
    // FundQuote.change 语义存疑（疑非当日涨跌额），不伪造涨跌幅，置 null，只展示净值 + change 原值
    return { name: q.name, price: q.nav, change: q.change, changePercent: null, isFund: true }
  }
  let q: { name: string; price: number; change: number; changePercent: number } | undefined
  switch (market) {
    case 'HK':
      q = (await client.getHKQuotes([code]))[0]
      break
    case 'US':
      q = (await client.getUSQuotes([code]))[0]
      break
    case 'A':
    default:
      q = (await client.getSimpleQuotes([code]))[0]
      break
  }
  if (!q) return null
  return { name: q.name, price: q.price, change: q.change, changePercent: q.changePercent }
}
