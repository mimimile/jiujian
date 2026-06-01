import type { ReactNode } from 'react'
import type { DetectResult } from '@shared/types'

interface Props {
  detect: DetectResult | null
  loading: boolean
  onRetry: () => void
}

export function StatusBanner({ detect, loading, onRetry }: Props): JSX.Element {
  if (loading) {
    return (
      <Bar tone="neutral">
        <span>正在检测本机 Claude Code…</span>
      </Bar>
    )
  }
  if (!detect) {
    return (
      <Bar tone="neutral">
        <span>尚未检测</span>
        <RetryBtn onRetry={onRetry} />
      </Bar>
    )
  }
  if (!detect.found) {
    return (
      <Bar tone="bad">
        <span>✕ 未找到 Claude Code。请先安装并登录（claude auth login）后重试。</span>
        <RetryBtn onRetry={onRetry} />
      </Bar>
    )
  }
  if (!detect.loggedIn) {
    return (
      <Bar tone="warn">
        <span>
          ⚠ 已找到 Claude Code {detect.version ?? ''}，但未登录。请在终端运行 <code>claude auth login</code> 后重试。
        </span>
        <RetryBtn onRetry={onRetry} />
      </Bar>
    )
  }
  return (
    <Bar tone="good">
      <span>
        ✓ Claude Code 就绪 {detect.version ? `· ${detect.version}` : ''}
        {detect.plan ? ` · 套餐 ${detect.plan}` : ''}
        {detect.authMethod ? ` · ${detect.authMethod}` : ''}
      </span>
      <RetryBtn onRetry={onRetry} />
    </Bar>
  )
}

function RetryBtn({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <button
      onClick={onRetry}
      className="ml-auto rounded border border-[var(--color-line)] px-2 py-0.5 text-xs text-gray-300 hover:bg-[var(--color-panel-2)]"
    >
      重新检测
    </button>
  )
}

function Bar({
  tone,
  children
}: {
  tone: 'good' | 'warn' | 'bad' | 'neutral'
  children: ReactNode
}): JSX.Element {
  const toneClass = {
    good: 'border-[var(--color-down)]/50 bg-[var(--color-down)]/10 text-green-200',
    warn: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
    bad: 'border-[var(--color-up)]/50 bg-[var(--color-up)]/10 text-red-200',
    neutral: 'border-[var(--color-line)] bg-[var(--color-panel-2)] text-gray-300'
  }[tone]
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${toneClass}`}>
      {children}
    </div>
  )
}
