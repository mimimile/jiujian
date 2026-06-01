// 共享类型：被 main 与 renderer 共用。禁止引入任何 Node / DOM 依赖。

export type RunId = string

export type Market = 'A' | 'HK' | 'US' | 'FUND'

/** 渲染层发起一次分析的请求 */
export interface RunRequest {
  prompt: string
  symbol?: string
  market?: Market
}

/** 环境探测结果：claude 二进制是否存在、版本、登录态 */
export interface DetectResult {
  found: boolean
  binaryPath: string | null
  version: string | null
  loggedIn: boolean
  authMethod: string | null // 如 'claude_subscription'
  plan: string | null // 如 'max' / 'pro'
  error?: string
}

export type ClaudeErrorCode =
  | 'NOT_FOUND' // claude 二进制未找到（ENOENT / exit 127）
  | 'NOT_LOGGED_IN' // 未登录订阅
  | 'CREDIT_EXHAUSTED' // 402 / Agent SDK 额度耗尽
  | 'CANCELLED' // 用户取消
  | 'SPAWN_ERROR'
  | 'UNKNOWN'

/** stream-json 归一化后推给渲染层的事件（按 runId 关联） */
export type ClaudeEvent =
  | { type: 'started'; runId: RunId }
  | { type: 'text'; runId: RunId; delta: string }
  | { type: 'tool'; runId: RunId; name: string; phase: 'start' | 'end' }
  | {
      type: 'done'
      runId: RunId
      text: string
      costUsd: number | null
      durationMs: number
    }
  | { type: 'error'; runId: RunId; message: string; code: ClaudeErrorCode }

/** 实时行情（行情头用，main 直拉 stock-sdk） */
export interface Quote {
  name: string
  /** 现价；基金为净值 nav */
  price: number
  change: number
  /** 涨跌幅%；基金可能为 null（接口不直接给） */
  changePercent: number | null
  isFund?: boolean
}

/** K 线蜡烛（喂给 KLineChart） */
export interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** preload 经 contextBridge 暴露给渲染层的 window.api 形状（preload 实现、renderer 声明，共用此契约） */
export interface JiuJianApi {
  system: {
    detect(): Promise<DetectResult>
  }
  claude: {
    run(req: RunRequest): Promise<{ runId: RunId }>
    cancel(runId: RunId): Promise<{ ok: boolean }>
    /** 订阅流式事件，返回取消订阅函数 */
    onEvent(cb: (e: ClaudeEvent) => void): () => void
  }
  stock: {
    /** 图表用日K（main 直接走 stock-sdk 拉取，不经 claude） */
    kline(req: { symbol: string; market: Market }): Promise<Candle[]>
    /** 实时行情（行情头用） */
    quote(req: { symbol: string; market: Market }): Promise<Quote | null>
  }
}
