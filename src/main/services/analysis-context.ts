import { StockSDK, addIndicators, type HistoryKline } from 'stock-sdk'
import type { Market } from '@shared/types'

let sdk: StockSDK | null = null
function getSdk(): StockSDK {
  if (!sdk) sdk = new StockSDK()
  return sdk
}

const COMPUTE_WINDOW = 150 // 算指标的窗口（够 MA60/MACD 收敛）
const SHOW_ROWS = 20 // 注入 prompt 的近 N 根日K

function fmt(n: number | null | undefined, d = 2): string {
  return n == null || !Number.isFinite(n) ? '-' : Number(n).toFixed(d)
}

/**
 * 本地预取并拼装"紧凑数据块"，注入 prompt 让 claude 直接分析、无需调用 MCP 工具。
 * 成本动机：claude 经 MCP 拉全历史K线(~6000根)单次 ~$1.5；改为 app 喂摘要后预计 $0.3–0.5。
 */
export async function buildAnalysisContext(symbol: string, market: Market): Promise<string> {
  const client = getSdk()
  const code = symbol.trim()

  // 1. 原始日K（按市场）
  let raw: HistoryKline[]
  if (market === 'HK') {
    raw = (await client.getHKHistoryKline(code)) as unknown as HistoryKline[]
  } else if (market === 'US') {
    raw = (await client.getUSHistoryKline(code)) as unknown as HistoryKline[]
  } else {
    raw = await client.getHistoryKline(code)
  }
  if (!raw.length) return `（未取到 ${code} 的日K线数据，请确认代码/市场是否正确。）`

  // 2. 指标：在足够窗口上计算，避免前段 NaN
  const windowed = raw.slice(-COMPUTE_WINDOW)
  const withInd = addIndicators(windowed, {
    ma: true,
    macd: true,
    boll: true,
    kdj: true,
    rsi: true
  })
  const recent = withInd.slice(-SHOW_ROWS)
  const last = withInd[withInd.length - 1]

  // 3. 资金流（A股 / ETF）
  let fundFlowLine = ''
  if (market === 'A' || market === 'FUND') {
    try {
      const ff = (await client.getFundFlow([code]))[0]
      if (ff) fundFlowLine = `资金流: ${JSON.stringify(ff).slice(0, 280)}`
    } catch {
      // 资金流非必需，失败忽略
    }
  }

  // 近 N 根紧凑表
  const rows = recent
    .map(
      (k) =>
        `${k.date} O${fmt(k.open)} H${fmt(k.high)} L${fmt(k.low)} C${fmt(k.close)} V${fmt(k.volume, 0)} ${
          k.changePercent == null ? '' : (k.changePercent >= 0 ? '+' : '') + fmt(k.changePercent) + '%'
        }`
    )
    .join('\n')

  const latestInd = JSON.stringify({
    ma: last.ma,
    macd: last.macd,
    boll: last.boll,
    kdj: last.kdj,
    rsi: last.rsi
  })

  return [
    `## ${code} 预取数据（截至 ${last.date}，公开端点，可能有数十秒~分钟延迟）`,
    `最新: 收${fmt(last.close)} 涨跌${fmt(last.changePercent)}% 量${fmt(last.volume, 0)} 换手${fmt(last.turnoverRate)}%`,
    `最新技术指标(JSON): ${latestInd}`,
    fundFlowLine,
    `近 ${recent.length} 根日K(前复权):`,
    rows
  ]
    .filter(Boolean)
    .join('\n')
}
