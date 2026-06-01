import type { ClaudeErrorCode } from '@shared/types'
import type { StreamState } from '../hooks/useClaudeStream'

const ERROR_HINT: Record<ClaudeErrorCode, string> = {
  NOT_FOUND: '未找到 claude。确认已安装 Claude Code 且在 PATH 中。',
  NOT_LOGGED_IN: '未登录。请在终端运行 claude auth login。',
  CREDIT_EXHAUSTED: '本月 Agent SDK 额度可能已用尽（402）。下月初重置，或升级套餐。',
  CANCELLED: '已取消本次分析。',
  SPAWN_ERROR: '启动 claude 进程失败。',
  UNKNOWN: 'claude 异常退出，详见错误信息。'
}

export function AnalysisPanel({ state }: { state: StreamState }): JSX.Element {
  const { running, text, tools, costUsd, durationMs, error } = state

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-2 text-sm text-gray-400">
        <span className="font-medium text-gray-200">AI 分析</span>
        {running && <span className="text-xs text-amber-300">● 分析中…</span>}
        {tools.length > 0 && (
          <span className="ml-2 flex flex-wrap gap-1">
            {tools.map((t, i) => (
              <code
                key={`${t}-${i}`}
                className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5 text-[11px] text-gray-300"
              >
                {t}
              </code>
            ))}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        {error ? (
          <div className="rounded border border-[var(--color-up)]/50 bg-[var(--color-up)]/10 p-3 text-sm text-red-200">
            <div className="font-medium">分析失败（{error.code}）</div>
            <div className="mt-1 text-red-300/90">{ERROR_HINT[error.code]}</div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-red-300/70">
              {error.message}
            </pre>
          </div>
        ) : text ? (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-gray-100">
            {text}
          </pre>
        ) : (
          <div className="grid h-full place-items-center text-sm text-gray-500">
            {running ? '正在请求 Claude…' : '输入股票代码，点击「分析」'}
          </div>
        )}
      </div>

      {(costUsd != null || durationMs != null) && (
        <div className="border-t border-[var(--color-line)] px-4 py-2 text-xs text-gray-400">
          {durationMs != null && <span>耗时 {(durationMs / 1000).toFixed(1)}s</span>}
          {costUsd != null && (
            <span className="ml-3">
              本次成本 ${costUsd.toFixed(4)}（计入你本月 Agent SDK 额度）
            </span>
          )}
        </div>
      )}
    </div>
  )
}
