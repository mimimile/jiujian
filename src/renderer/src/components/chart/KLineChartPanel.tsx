import { useEffect, useRef, useState } from 'react'
import { init, dispose, type Chart, type KLineData } from 'klinecharts'
import type { Market } from '@shared/types'

interface Props {
  symbol: string
  market: Market
}

export function KLineChartPanel({ symbol, market }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  // 初始化图表（一次）
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const chart = init(el)
    chartRef.current = chart
    // 显式钉死红涨绿跌（klinecharts 默认即如此，这里固化意图）
    chart?.setStyles({
      candle: {
        bar: {
          upColor: '#e5484d',
          downColor: '#2f9e44',
          noChangeColor: '#888888',
          upBorderColor: '#e5484d',
          downBorderColor: '#2f9e44',
          noChangeBorderColor: '#888888',
          upWickColor: '#e5484d',
          downWickColor: '#2f9e44',
          noChangeWickColor: '#888888'
        }
      }
    })
    // 指标：MA 叠加主图 candle_pane；VOL / MACD 各自副图
    chart?.createIndicator('MA', true, { id: 'candle_pane' })
    chart?.createIndicator('VOL')
    chart?.createIndicator('MACD')
    return () => {
      if (el) dispose(el)
      chartRef.current = null
    }
  }, [])

  // symbol/market 变化时拉日K（防抖 500ms）
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
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [symbol, market])

  return (
    <div className="flex h-full flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-2 text-sm text-gray-400">
        <span className="font-medium text-gray-200">K线（日）</span>
        {loading && <span className="text-xs text-amber-300">加载中…</span>}
        {!loading && !error && count > 0 && (
          <span className="text-xs text-gray-500">{count} 根</span>
        )}
        {error && <span className="text-xs text-[var(--color-up)]">数据获取失败</span>}
      </div>
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0 bg-white" />
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-[var(--color-panel)]/90 p-2 text-center text-xs text-red-300/80">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
