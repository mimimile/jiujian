import { z } from 'zod'

// IPC payload 校验。main 侧在处理任何来自 renderer 的入参前必须先过这些 schema。

export const runRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  symbol: z.string().max(32).optional(),
  market: z.enum(['A', 'HK', 'US', 'FUND']).optional()
})

export const cancelRequestSchema = z.object({
  runId: z.string().min(1).max(128)
})

export const klineRequestSchema = z.object({
  symbol: z.string().min(1).max(32),
  market: z.enum(['A', 'HK', 'US', 'FUND'])
})

// 行情请求与 K线同形
export const quoteRequestSchema = klineRequestSchema

export type RunRequestInput = z.infer<typeof runRequestSchema>
export type CancelRequestInput = z.infer<typeof cancelRequestSchema>
export type KlineRequestInput = z.infer<typeof klineRequestSchema>
