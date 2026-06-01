import type { Market } from '@shared/types'

const NS = 'mcp__stock-sdk__'

/**
 * 单股分析按市场精选的 MCP 工具。
 *
 * 实测（2026-06-01）：广配 `mcp__stock-sdk` + ToolSearch 单次 $0.238；
 * 窄化为精确工具、去掉 ToolSearch 后单次 $0.135（降 ~43%），工具仍能直接调用。
 * ToolSearch 的工具目录加载 + 多轮往返是成本大头，故不放行。
 */
const TOOLS: Record<Market, string[]> = {
  A: ['get_a_share_quotes', 'get_history_kline', 'get_kline_with_indicators', 'get_fund_flow'],
  HK: ['get_hk_quotes', 'get_hk_history_kline'],
  US: ['get_us_quotes', 'get_us_history_kline'],
  FUND: ['get_fund_quotes', 'get_history_kline']
}

/** 精选工具的 allowedTools 串（空格分隔）。 */
export function allowedToolsFor(market: Market): string {
  return (TOOLS[market] ?? TOOLS.A).map((t) => NS + t).join(' ')
}
