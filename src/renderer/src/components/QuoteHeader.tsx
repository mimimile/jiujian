import { useEffect, useState } from 'react'
import type { Market, Quote } from '@shared/types'
import { MARKET_LABEL } from '../lib/prompt'

interface Props {
  symbol: string
  market: Market
}

/** 醒目行情条：名称 + 大号等宽现价 + 涨跌（红涨绿跌）。 */
export function QuoteHeader({ symbol, market }: Props): JSX.Element {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const code = symbol.trim()
    if (!code) {
      setQuote(null)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setError(false)
      try {
        const q = await window.api.stock.quote({ symbol: code, market })
        if (!cancelled) setQuote(q)
      } catch {
        if (!cancelled) {
          setQuote(null)
          setError(true)
        }
      }
    }, 450)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [symbol, market])

  const code = symbol.trim().toUpperCase()

  return (
    <div className="flex items-end gap-4 border-b border-line bg-panel/40 px-4 py-2.5">
      <div className="flex items-baseline gap-2">
        <span className="cjk text-base font-semibold text-text">{quote?.name ?? '—'}</span>
        <span className="text-[11px] tracking-wider text-faint">{code || '—'}</span>
        <span className="rounded-sm border border-line px-1 text-[10px] tracking-wide text-muted">
          {MARKET_LABEL[market]}
        </span>
      </div>

      {error ? (
        <span className="cjk pb-0.5 text-xs text-faint">行情获取失败</span>
      ) : quote ? (
        <QuoteFigures quote={quote} />
      ) : (
        <span className="nums pb-0.5 text-2xl font-semibold tracking-tight text-faint">––––.––</span>
      )}
    </div>
  )
}

function QuoteFigures({ quote }: { quote: Quote }): JSX.Element {
  const up = quote.change >= 0
  const color = up ? 'text-up' : 'text-down'
  const sign = up ? '+' : ''
  const dp = quote.isFund ? 4 : 2
  return (
    <div className="jj-reveal flex items-end gap-3">
      <span className={`nums text-3xl font-semibold leading-none tracking-tight ${color}`}>
        {quote.price.toFixed(dp)}
      </span>
      <div className={`nums flex flex-col pb-0.5 text-xs leading-tight ${color}`}>
        <span>
          {sign}
          {quote.change.toFixed(dp)}
        </span>
        <span>
          {quote.changePercent == null ? (quote.isFund ? '净值' : '—') : `${sign}${quote.changePercent.toFixed(2)}%`}
        </span>
      </div>
    </div>
  )
}
