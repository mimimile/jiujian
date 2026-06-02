import type { ClaudeEvent, JiuJianApi } from '@shared/types'

/**
 * 浏览器预览用的假 window.api。
 * 仅当 window.api 不存在时安装（即在普通浏览器里预览 UI），Electron 内由 preload 提供真 api，永不触发。
 */
export function installDevMockIfNeeded(): void {
  if (typeof window === 'undefined') return
  const w = window as unknown as { api?: JiuJianApi }
  if (w.api) return

  const candles = makeCandles()
  let onEventCb: ((e: ClaudeEvent) => void) | null = null

  w.api = {
    system: {
      detect: async () => ({
        found: true,
        binaryPath: '/Users/demo/.local/bin/claude',
        version: 'Claude Code 2.1.156',
        loggedIn: true,
        authMethod: 'claude_subscription',
        plan: 'max'
      }),
      setBackgroundMode: async (v: boolean) => v,
      getBackgroundMode: async () => false,
      onTriggerRecap: () => () => {}
    },
    claude: {
      run: async () => {
        const runId = 'mock-run'
        const md = SAMPLE_MD
        const chunks = md.match(/[\s\S]{1,14}/g) ?? []
        window.setTimeout(() => onEventCb?.({ type: 'started', runId }), 60)
        window.setTimeout(() => onEventCb?.({ type: 'tool', runId, name: 'get_history_kline', phase: 'start' }), 120)
        chunks.forEach((ch, i) =>
          window.setTimeout(() => onEventCb?.({ type: 'text', runId, delta: ch }), 260 + i * 28)
        )
        window.setTimeout(
          () => onEventCb?.({ type: 'done', runId, text: md, costUsd: 0.1278, durationMs: 4180 }),
          260 + chunks.length * 28 + 200
        )
        return { runId }
      },
      recap: async () => {
        const runId = 'mock-recap'
        const md = SAMPLE_RECAP_MD
        const chunks = md.match(/[\s\S]{1,14}/g) ?? []
        window.setTimeout(() => onEventCb?.({ type: 'started', runId }), 60)
        chunks.forEach((ch, i) =>
          window.setTimeout(() => onEventCb?.({ type: 'text', runId, delta: ch }), 260 + i * 22)
        )
        window.setTimeout(
          () => onEventCb?.({ type: 'done', runId, text: md, costUsd: 0.2106, durationMs: 5200 }),
          260 + chunks.length * 22 + 200
        )
        return { runId }
      },
      cancel: async () => ({ ok: true }),
      onEvent: (cb) => {
        onEventCb = cb
        return () => {
          onEventCb = null
        }
      }
    },
    stock: {
      kline: async () => candles,
      quote: async ({ symbol }) => ({
        name: symbol.includes('600519') ? '贵州茅台' : '示例标的',
        price: 1309.6,
        change: -16.4,
        changePercent: -1.24
      })
    }
  }
}

function makeCandles(): Array<{
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}> {
  const out = []
  let price = 1400
  let t = Date.UTC(2026, 0, 1)
  for (let i = 0; i < 120; i++) {
    const drift = Math.sin(i / 9) * 6 - 1.2
    const open = price
    const close = Math.max(1240, open + drift + (Math.random() - 0.5) * 22)
    const high = Math.max(open, close) + Math.random() * 10
    const low = Math.min(open, close) - Math.random() * 10
    const volume = 30000 + Math.round(Math.random() * 60000)
    out.push({ timestamp: t, open, high, low, close, volume })
    price = close
    t += 86400000
  }
  return out
}

const SAMPLE_MD = `贵州茅台 sh600519 分析。数据截至 2026-06-01。**非投资建议**。

## 1. 趋势研判
- **长线空头**。MA 全空头排列：ma5(1297) < ma10(1301) < ma20(1329) < ma60(1396)。趋势向下未破。
- **短线超跌反弹**。价从 4 月底 1400 跌到 5 月低点 1270 后反抽，现价夹在 ma10 与 ma20 间。
- 反弹性质，非反转。需站稳 ma20(1329) 且放量才谈转势。

## 2. 关键支撑 / 压力位
- **压力**：1329（ma20 + BOLL 中轨）、1396（ma60）。
- **支撑**：1270（5 月低点）、1250（52 周低）。

## 3. 量价与资金流
- 量比 0.74 缩量反弹，力度存疑。
- 主力资金近 5 日净流出，需关注承接。

## 4. 风险提示
- 高位估值回归未结束，反弹失败或再创新低。
- 数据可能延迟，不构成投资建议。`

const SAMPLE_RECAP_MD = `# 自选股盘后复盘 · 2026-06-01

## 1. 大盘与整体情绪
- 上证指数收跌，量能温和。市场情绪偏谨慎，权重股领跌。

## 2. 今日表现分化
- **弱势**：贵州茅台 −1.24%（空头排列，MACD 绿柱），承压明显。
- **相对抗跌**：腾讯控股微跌，资金小幅净流入。

## 3. 值得关注
- **贵州茅台**：超跌反弹临近 ma20(1329) 压力，关注能否放量站稳。
- **AAPL**：RSI 回落至中性，趋势待观察。

## 4. 风险与明日关注
- 权重股估值回归未结束，注意指数下行风险。
- 明日关注量能能否放大、北向资金动向。

数据可能延迟，不构成投资建议。`
