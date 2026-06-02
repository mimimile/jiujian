import { useState, type ReactNode } from 'react'
import type { DetectResult } from '@shared/types'

interface Props {
  detect: DetectResult | null
  onRetry: () => void
}

/** claude 未就绪时的设置引导（嵌在 AI 分析栏）。 */
export function Onboarding({ detect, onRetry }: Props): JSX.Element {
  const notFound = !detect?.found
  let step = 1

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center gap-2 border-b border-line px-4 py-2">
        <span className="text-[11px] font-medium tracking-[0.18em] text-muted">开始 · SETUP</span>
        <span className="jj-blink ml-auto text-[10px] text-up">● {notFound ? '未找到 Claude' : '未登录'}</span>
      </header>

      <div className="flex-1 overflow-auto px-5 py-5">
        <div className="jj-reveal mx-auto max-w-md">
          <div className="flex items-baseline gap-2">
            <span className="cjk text-xl font-bold text-text">韭见</span>
            <span className="text-[10px] tracking-[0.32em] text-gold">JIUJIAN</span>
          </div>
          <h2 className="cjk mt-3 text-base font-semibold text-text">
            {notFound ? '未检测到 Claude Code' : 'Claude Code 已安装，但未登录'}
          </h2>
          <p className="cjk mt-1.5 text-xs leading-relaxed text-muted">
            韭见复用你本机的 Claude Code 订阅做 AI 分析，需先安装并登录。左侧图表已可正常使用。
          </p>

          <div className="mt-5 space-y-4">
            {notFound && (
              <Step n={step++} title="安装 Claude Code">
                <a
                  href="https://code.claude.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold underline decoration-gold-dim underline-offset-2 hover:brightness-110"
                >
                  打开官方安装文档 ↗
                </a>
              </Step>
            )}
            <Step n={step++} title="用订阅登录">
              <CopyCmd cmd="claude auth login" />
              <div className="cjk mt-1 text-[11px] text-faint">在终端运行，用你的 Pro / Max 订阅登录</div>
            </Step>
            <Step n={step++} title="回到韭见，重新检测">
              <button
                onClick={onRetry}
                className="rounded-sm bg-gold px-4 py-1.5 text-xs font-semibold text-ink transition-all hover:brightness-110"
              >
                重新检测
              </button>
            </Step>
          </div>

          {detect?.error && (
            <div className="cjk mt-5 text-[11px] text-faint">检测信息：{detect.error}</div>
          )}
          <div className="cjk mt-5 border-t border-line pt-3 text-[10px] leading-relaxed text-faint">
            分析按需消耗你订阅自带的月度 Agent SDK 额度（单股约 $0.13、复盘约 $0.11），韭见不另收费。
          </div>
        </div>
      </div>
    </section>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex gap-3">
      <span className="nums mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/40 text-[11px] text-gold">
        {n}
      </span>
      <div className="min-w-0">
        <div className="cjk text-xs font-medium text-text">{title}</div>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  )
}

function CopyCmd({ cmd }: { cmd: string }): JSX.Element {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(cmd).then(
          () => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1200)
          },
          () => {}
        )
      }}
      className="group flex items-center gap-2 rounded-sm border border-line bg-ink px-3 py-1.5 font-mono text-xs text-text hover:border-line-2"
      title="点击复制"
    >
      <span className="text-gold">$</span>
      <span>{cmd}</span>
      <span className="ml-1 text-[10px] text-faint">{copied ? '已复制' : '复制'}</span>
    </button>
  )
}
