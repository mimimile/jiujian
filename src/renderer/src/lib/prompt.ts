import type { Market } from '@shared/types'

export const MARKET_LABEL: Record<Market, string> = {
  A: 'A股',
  HK: '港股',
  US: '美股',
  FUND: '基金/ETF'
}

/**
 * 构造给 claude 的分析 prompt。Claude 会经 stock-sdk MCP 自行拉取实时行情/K线/指标/资金流。
 */
export function buildAnalysisPrompt(symbol: string, market: Market): string {
  const code = symbol.trim()
  // 数据由 main 进程本地预取后注入到 prompt 前面（见 analysis-context.ts），这里只给分析指令。
  return [
    `请对${MARKET_LABEL[market]}标的「${code}」做深度分析，给出：`,
    '1. 趋势研判（短中期）；',
    '2. 关键支撑位 / 压力位；',
    '3. 量价与资金流解读（结合给定的技术指标 MA/MACD/KDJ/RSI/BOLL 与资金流数据）；',
    '4. 主要风险提示。',
    '用中文、分点、简明。最后注明数据可能有数十秒到分钟级延迟，本分析不构成投资建议。'
  ].join('\n')
}
