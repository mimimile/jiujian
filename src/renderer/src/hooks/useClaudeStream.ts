import { useCallback, useEffect, useRef, useState } from 'react'
import type { ClaudeEvent, ClaudeErrorCode, Market, RunId, RunRequest } from '@shared/types'

export interface StreamState {
  runId: RunId | null
  running: boolean
  text: string
  tools: string[]
  costUsd: number | null
  durationMs: number | null
  error: { message: string; code: ClaudeErrorCode } | null
}

const INITIAL: StreamState = {
  runId: null,
  running: false,
  text: '',
  tools: [],
  costUsd: null,
  durationMs: null,
  error: null
}

export function useClaudeStream(): {
  state: StreamState
  run: (req: RunRequest) => Promise<void>
  recap: (items: Array<{ symbol: string; market: Market }>) => Promise<void>
  cancel: () => Promise<void>
} {
  const [state, setState] = useState<StreamState>(INITIAL)
  const runIdRef = useRef<RunId | null>(null)

  useEffect(() => {
    const off = window.api.claude.onEvent((e: ClaudeEvent) => {
      // 已知当前 runId 时只收该 run 的事件；未知时（首个事件早于 invoke 返回）全收
      if (runIdRef.current && e.runId !== runIdRef.current) return
      setState((s) => {
        switch (e.type) {
          case 'text':
            return { ...s, text: s.text + e.delta }
          case 'tool':
            return { ...s, tools: [...s.tools, e.name] }
          case 'done':
            return {
              ...s,
              running: false,
              text: e.text || s.text,
              costUsd: e.costUsd,
              durationMs: e.durationMs
            }
          case 'error':
            return { ...s, running: false, error: { message: e.message, code: e.code } }
          default:
            return s
        }
      })
    })
    return off
  }, [])

  const run = useCallback(async (req: RunRequest) => {
    runIdRef.current = null
    setState({ ...INITIAL, running: true })
    const { runId } = await window.api.claude.run(req)
    runIdRef.current = runId
    setState((s) => ({ ...s, runId }))
  }, [])

  const recap = useCallback(async (items: Array<{ symbol: string; market: Market }>) => {
    runIdRef.current = null
    setState({ ...INITIAL, running: true })
    const { runId } = await window.api.claude.recap(items)
    runIdRef.current = runId
    setState((s) => ({ ...s, runId }))
  }, [])

  const cancel = useCallback(async () => {
    if (runIdRef.current) await window.api.claude.cancel(runIdRef.current)
  }, [])

  return { state, run, recap, cancel }
}
