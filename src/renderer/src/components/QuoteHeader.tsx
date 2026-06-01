import { useEffect, useState } from 'react'
import type { Market, Quote } from '@shared/types'

interface Props {
  symbol: string
  market: Market
}

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
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [symbol, market])

  if (error) return <span className="text-xs text-gray-500">行情获取失败</span>
  if (!quote) return <span className="text-xs text-gray-600">—</span>

  const up = quote.change >= 0
  const color = up ? 'text-[var(--color-up)]' : 'text-[var(--color-down)]'
  const sign = up ? '+' : ''
  const dp = quote.isFund ? 4 : 2

  return (
    <div className="flex items-baseline gap-3">
      <span className="text-sm font-medium text-gray-100">{quote.name}</span>
      <span className={`text-lg font-semibold ${color}`}>{quote.price.toFixed(dp)}</span>
      <span className={`text-sm ${color}`}>
        {sign}
        {quote.change.toFixed(dp)}
        {quote.changePercent != null && ` (${sign}${quote.changePercent.toFixed(2)}%)`}
      </span>
      {quote.isFund && <span className="text-xs text-gray-500">净值</span>}
    </div>
  )
}
