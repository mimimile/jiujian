import { useCallback, useEffect, useState } from 'react'
import type { DetectResult, Market } from '@shared/types'
import { StatusBanner } from './components/StatusBanner'
import { AnalysisPanel } from './components/AnalysisPanel'
import { KLineChartPanel } from './components/chart/KLineChartPanel'
import { useClaudeStream } from './hooks/useClaudeStream'
import { buildAnalysisPrompt, MARKET_LABEL } from './lib/prompt'

const MARKETS: Market[] = ['A', 'HK', 'US', 'FUND']

const inputCls =
  'flex-1 rounded border border-[var(--color-line)] bg-[var(--color-ink)] px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-gray-500'

export default function App(): JSX.Element {
  const [detect, setDetect] = useState<DetectResult | null>(null)
  const [detecting, setDetecting] = useState(true)
  const [symbol, setSymbol] = useState('sh600519')
  const [market, setMarket] = useState<Market>('A')
  const { state, run, cancel } = useClaudeStream()

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
  const canRun = ready && symbol.trim().length > 0 && !state.running

  const onAnalyze = (): void => {
    const code = symbol.trim()
    if (!code) return
    void run({ prompt: buildAnalysisPrompt(code, market), symbol: code, market })
  }

  return (
    <div className="flex h-screen flex-col gap-3 p-4">
      <header className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-100">
          韭见 <span className="text-sm font-normal text-gray-500">JiuJian · 让韭菜有洞见</span>
        </h1>
        <div className="ml-auto w-[62%] min-w-[420px]">
          <StatusBanner detect={detect} loading={detecting} onRetry={() => void runDetect()} />
        </div>
      </header>

      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-2">
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value as Market)}
          className="rounded border border-[var(--color-line)] bg-[var(--color-ink)] px-2 py-1.5 text-sm text-gray-100 outline-none"
        >
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
          placeholder="股票代码，如 sh600519 / 00700 / AAPL"
          className={inputCls}
        />
        {state.running ? (
          <button
            onClick={() => void cancel()}
            className="rounded bg-[var(--color-up)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            取消
          </button>
        ) : (
          <button
            onClick={onAnalyze}
            disabled={!canRun}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            分析
          </button>
        )}
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <KLineChartPanel symbol={symbol} market={market} />
        <AnalysisPanel state={state} />
      </main>
    </div>
  )
}
