import { useEffect, useRef, useState } from 'react'
import { init, dispose, type Chart, type KLineData } from 'klinecharts'
import type { Market } from '@shared/types'

interface Props {
  symbol: string
  market: Market
}

const UP = '#f6394e'
const DOWN = '#16b877'
const GOLD = '#e7b53c'
const LINE = '#1c1e24'
const AXIS = '#23252c'
const MUTED = '#8b8f98'

export function KLineChartPanel({ symbol, market }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = init(el)
    chartRef.current = chart
    chart?.setStyles({
      grid: {
        horizontal: { color: LINE },
        vertical: { color: LINE }
      },
      candle: {
        bar: {
          upColor: UP,
          downColor: DOWN,
          noChangeColor: MUTED,
          upBorderColor: UP,
          downBorderColor: DOWN,
          noChangeBorderColor: MUTED,
          upWickColor: UP,
          downWickColor: DOWN,
          noChangeWickColor: MUTED
        }
      },
      xAxis: { axisLine: { color: AXIS }, tickLine: { color: AXIS }, tickText: { color: MUTED } },
      yAxis: { axisLine: { color: AXIS }, tickLine: { color: AXIS }, tickText: { color: MUTED } },
      separator: { color: AXIS },
      crosshair: {
        horizontal: { line: { color: GOLD }, text: { backgroundColor: GOLD, borderColor: GOLD } },
        vertical: { line: { color: GOLD }, text: { backgroundColor: GOLD, borderColor: GOLD } }
      }
    })
    chart?.createIndicator('MA', true, { id: 'candle_pane' })
    chart?.createIndicator('VOL')
    chart?.createIndicator('MACD')
    return () => {
      if (el) dispose(el)
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const code = symbol.trim()
    if (!code) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const candles = await window.api.stock.kline({ symbol: code, market })
        if (cancelled) return
        chartRef.current?.applyNewData(candles as KLineData[])
        setCount(candles.length)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 450)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [symbol, market])

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-md border border-line bg-panel">
      <header className="flex items-center gap-2 border-b border-line px-4 py-2">
        <span className="text-[11px] font-medium tracking-[0.18em] text-muted">K线 · DAILY</span>
        <span className="text-[10px] text-faint">MA · VOL · MACD</span>
        {loading && <span className="jj-blink ml-auto text-[10px] text-gold">载入中</span>}
        {!loading && !error && count > 0 && <span className="nums ml-auto text-[10px] text-faint">{count} 根</span>}
        {error && <span className="cjk ml-auto text-[10px] text-up">数据获取失败</span>}
      </header>
      <div className="relative flex-1 bg-ink">
        <div ref={containerRef} className="absolute inset-0" />
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-panel/90 p-2 text-center text-[10px] text-up/80">
            {error}
          </div>
        )}
      </div>
    </section>
  )
}
