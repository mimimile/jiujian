import Markdown from 'react-markdown'
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
    <section className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center gap-2 border-b border-line px-4 py-2">
        <span className="text-[11px] font-medium tracking-[0.18em] text-muted">AI 分析 · CLAUDE</span>
        {running && <span className="jj-blink text-[10px] text-gold">● 推理中</span>}
        {tools.length > 0 && (
          <span className="ml-auto flex flex-wrap justify-end gap-1">
            {tools.slice(-4).map((t, i) => (
              <code key={`${t}-${i}`} className="rounded-sm bg-panel-2 px-1.5 py-0.5 text-[10px] text-faint">
                {t}
              </code>
            ))}
          </span>
        )}
      </header>

      <div className="relative flex-1 overflow-auto px-4 py-3">
        {error ? (
          <div className="jj-reveal rounded border border-up/40 bg-up/5 p-3 text-xs">
            <div className="font-medium text-up">分析失败 · {error.code}</div>
            <div className="cjk mt-1 text-muted">{ERROR_HINT[error.code]}</div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] text-faint">{error.message}</pre>
          </div>
        ) : text ? (
          <div className="prose-jj jj-reveal">
            <Markdown>{text}</Markdown>
          </div>
        ) : running ? (
          <LoadingHint />
        ) : (
          <EmptyHint />
        )}
      </div>

      {(costUsd != null || durationMs != null) && (
        <footer className="nums flex items-center gap-3 border-t border-line px-4 py-1.5 text-[11px] text-muted">
          {durationMs != null && <span>⧗ {(durationMs / 1000).toFixed(1)}s</span>}
          {costUsd != null && <span className="font-medium text-gold">${costUsd.toFixed(4)}</span>}
          {costUsd != null && <span className="cjk text-faint">计入本月 Agent SDK 额度</span>}
        </footer>
      )}
    </section>
  )
}

function LoadingHint(): JSX.Element {
  return (
    <div className="space-y-2.5 pt-1">
      <div className="cjk jj-blink text-[11px] text-gold">› 本地预取数据 · 调用 Claude 推理…</div>
      {[92, 78, 85, 64, 80].map((w, i) => (
        <div key={i} className="jj-shimmer h-3 rounded-sm bg-panel-2" style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}

function EmptyHint(): JSX.Element {
  return (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <div className="text-4xl text-line-2">◰</div>
        <div className="cjk mt-3 text-xs text-muted">输入股票代码，点「分析」</div>
        <div className="cjk mt-1 text-[10px] text-faint">单次约 $0.13 · 计入你的订阅额度</div>
      </div>
    </div>
  )
}
