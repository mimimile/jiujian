import type { DetectResult } from '@shared/types'

interface Props {
  detect: DetectResult | null
  loading: boolean
  onRetry: () => void
}

/** 紧凑状态胶囊（masthead 右侧）：金=就绪/告警，红=未找到。点击重新探测。 */
export function StatusBanner({ detect, loading, onRetry }: Props): JSX.Element {
  let dot = 'bg-gold'
  let label = '检测中'
  let title = '正在检测 Claude Code'
  let blink = false

  if (loading) {
    blink = true
  } else if (!detect || !detect.found) {
    dot = 'bg-up'
    label = '未找到 CLAUDE'
    title = '未找到 Claude Code，请安装并 claude auth login'
  } else if (!detect.loggedIn) {
    dot = 'bg-gold'
    label = '未登录'
    title = '已找到 Claude Code 但未登录，请运行 claude auth login'
  } else {
    dot = 'bg-gold'
    label = detect.plan ? detect.plan.toUpperCase() : '就绪'
    title = `Claude 就绪 · ${detect.version ?? ''} · ${detect.authMethod ?? ''}`.trim()
  }

  return (
    <button
      onClick={onRetry}
      title={title}
      className="group flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3 py-1 text-[11px] tracking-wide text-muted transition-colors hover:border-line-2 hover:text-text"
    >
      <span className={`h-[7px] w-[7px] rounded-full ${dot} ${blink ? 'jj-blink' : ''}`} />
      <span>{label}</span>
      <span className="text-faint opacity-0 transition-opacity group-hover:opacity-100">↻</span>
    </button>
  )
}
