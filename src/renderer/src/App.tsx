import { useCallback, useEffect, useState } from 'react'
import type { DetectResult, Market } from '@shared/types'
import { StatusBanner } from './components/StatusBanner'
import { QuoteHeader } from './components/QuoteHeader'
import { AnalysisPanel } from './components/AnalysisPanel'
import { Watchlist } from './components/Watchlist'
import { KLineChartPanel } from './components/chart/KLineChartPanel'
import { useClaudeStream } from './hooks/useClaudeStream'
import { useWatchlist } from './hooks/useWatchlist'
import { buildAnalysisPrompt, MARKET_LABEL } from './lib/prompt'

const MARKETS: Market[] = ['A', 'HK', 'US', 'FUND']

const fieldCls =
  'rounded-sm border border-line bg-ink px-2.5 py-1.5 text-xs text-text outline-none transition-colors focus:border-gold/60'

export default function App(): JSX.Element {
  const [detect, setDetect] = useState<DetectResult | null>(null)
  const [detecting, setDetecting] = useState(true)
  const [symbol, setSymbol] = useState('sh600519')
  const [market, setMarket] = useState<Market>('A')
  const { state, run, recap, cancel } = useClaudeStream()
  const wl = useWatchlist()
  const trimmed = symbol.trim()
  const watched = wl.has(trimmed, market)

  const runDetect = useCallback(async () => {
    setDetecting(true)
    try {
      setDetect(await window.api.system.detect())
    } finally {
      setDetecting(false)
    }
  }, [])

  useEffect(() => {
    void runDetect()
  }, [runDetect])

  const ready = Boolean(detect?.found && detect?.loggedIn)
  const canRun = ready && trimmed.length > 0 && !state.running

  const onAnalyze = (): void => {
    if (!trimmed) return
    void run({ prompt: buildAnalysisPrompt(trimmed, market), symbol: trimmed, market })
  }

  return (
    <div className="flex h-screen flex-col">
      {/* MASTHEAD · 终端命令栏 */}
      <header className="flex items-center gap-3 border-b border-line bg-panel/50 px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="cjk text-lg font-bold leading-none tracking-tight text-text">韭见</span>
          <span className="text-[10px] font-medium tracking-[0.32em] text-gold">JIUJIAN</span>
        </div>
        <span className="cjk hidden text-[10px] text-faint lg:inline">让韭菜有洞见</span>

        <div className="ml-4 flex flex-1 items-center gap-2">
          <select value={market} onChange={(e) => setMarket(e.target.value as Market)} className={fieldCls}>
            {MARKETS.map((m) => (
              <option key={m} value={m}>
                {MARKET_LABEL[m]}
              </option>
            ))}
          </select>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canRun) onAnalyze()
            }}
            placeholder="代码 sh600519 / 00700 / AAPL"
            spellCheck={false}
            className={`${fieldCls} w-60 uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:text-faint`}
          />
          {state.running ? (
            <button
              onClick={() => void cancel()}
              className="rounded-sm border border-up/50 px-4 py-1.5 text-xs font-semibold text-up transition-colors hover:bg-up/10"
            >
              取消
            </button>
          ) : (
            <button
              onClick={onAnalyze}
              disabled={!canRun}
              className="rounded-sm bg-gold px-5 py-1.5 text-xs font-semibold tracking-wide text-ink transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line-2 disabled:text-faint"
            >
              分析
            </button>
          )}
          <button
            onClick={() => (watched ? wl.remove(trimmed, market) : wl.add({ symbol: trimmed, market }))}
            disabled={!trimmed}
            title={watched ? '移出自选' : '加入自选'}
            className={`rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-30 ${
              watched
                ? 'border-gold/50 text-gold'
                : 'border-line text-muted hover:border-line-2 hover:text-text'
            }`}
          >
            {watched ? '★ 已自选' : '☆ 自选'}
          </button>
          <button
            onClick={() => void recap(wl.items)}
            disabled={!ready || wl.items.length === 0 || state.running}
            title="对全部自选股做盘后复盘"
            className="rounded-sm border border-gold/40 px-3 py-1.5 text-xs text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:border-line disabled:text-faint"
          >
            ⊞ 复盘
          </button>
        </div>

        <StatusBanner detect={detect} loading={detecting} onRetry={() => void runDetect()} />
      </header>

      {/* 行情条 */}
      <div className="jj-reveal" style={{ animationDelay: '60ms' }}>
        <QuoteHeader symbol={symbol} market={market} />
      </div>

      {/* 主区 */}
      <div className="flex min-h-0 flex-1">
        <div className="jj-reveal h-full shrink-0" style={{ animationDelay: '120ms' }}>
          <Watchlist
            items={wl.items}
            current={{ symbol: trimmed, market }}
            onSelect={(it) => {
              setSymbol(it.symbol)
              setMarket(it.market)
            }}
            onRemove={wl.remove}
          />
        </div>
        <main className="grid min-h-0 flex-1 grid-cols-2 gap-2 p-2">
          <div className="jj-reveal min-h-0" style={{ animationDelay: '160ms' }}>
            <KLineChartPanel symbol={symbol} market={market} />
          </div>
          <div className="jj-reveal min-h-0" style={{ animationDelay: '200ms' }}>
            <AnalysisPanel state={state} />
          </div>
        </main>
      </div>

      {/* 免责声明常驻 */}
      <footer className="flex items-center gap-2 border-t border-line bg-ink-2 px-4 py-1 text-[10px] text-faint">
        <span className="text-gold-dim">⚠</span>
        <span className="cjk">
          数据源为公开端点，可能延迟数十秒~分钟 · 本应用输出为数据分析，<span className="text-muted">非投资建议</span>，据此操作风险自负
        </span>
        <span className="nums ml-auto tracking-wider text-faint">v0.1.0</span>
      </footer>
    </div>
  )
}
