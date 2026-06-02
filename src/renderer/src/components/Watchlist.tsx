import { useEffect, useState } from 'react'
import type { Market, Quote } from '@shared/types'
import type { WatchItem } from '../hooks/useWatchlist'
import { MARKET_LABEL } from '../lib/prompt'

interface Props {
  items: WatchItem[]
  current: WatchItem
  onSelect: (it: WatchItem) => void
  onRemove: (symbol: string, market: Market) => void
}

export function Watchlist({ items, current, onSelect, onRemove }: Props): JSX.Element {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-line bg-panel/30">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="text-[11px] font-medium tracking-[0.18em] text-muted">自选 · WATCHLIST</span>
        <span className="nums text-[11px] text-faint">{items.length}</span>
      </div>
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="cjk p-3 text-[11px] leading-relaxed text-faint">
            空。输入代码后点工具栏 <span className="text-gold">☆ 自选</span> 加入。
          </div>
        ) : (
          items.map((it) => (
            <WatchRow
              key={`${it.market}:${it.symbol}`}
              item={it}
              active={it.symbol === current.symbol && it.market === current.market}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))
        )}
      </div>
    </aside>
  )
}

function WatchRow({
  item,
  active,
  onSelect,
  onRemove
}: {
  item: WatchItem
  active: boolean
  onSelect: (it: WatchItem) => void
  onRemove: (symbol: string, market: Market) => void
}): JSX.Element {
  const [quote, setQuote] = useState<Quote | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api.stock
      .quote({ symbol: item.symbol, market: item.market })
      .then((q) => {
        if (!cancelled) setQuote(q)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [item.symbol, item.market])

  const up = quote ? quote.change >= 0 : false
  const color = quote ? (up ? 'text-up' : 'text-down') : 'text-faint'
  const dp = item.market === 'FUND' ? 4 : 2

  return (
    <div
      onClick={() => onSelect(item)}
      className={`group relative flex cursor-pointer items-center gap-2 border-l-2 px-3 py-2 transition-colors ${
        active ? 'border-gold bg-panel-2' : 'border-transparent hover:bg-panel-2/60'
      }`}
    >
      <span className="w-6 shrink-0 text-[9px] tracking-wide text-faint">{MARKET_LABEL[item.market]}</span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs text-text">{item.symbol.toUpperCase()}</span>
        {quote && <span className="cjk truncate text-[10px] text-faint">{quote.name}</span>}
      </div>
      <div className="nums ml-auto flex flex-col items-end leading-tight">
        <span className={`text-xs ${color}`}>{quote ? quote.price.toFixed(dp) : '––'}</span>
        {quote && quote.changePercent != null && (
          <span className={`text-[10px] ${color}`}>
            {quote.change >= 0 ? '+' : ''}
            {quote.changePercent.toFixed(2)}%
          </span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.symbol, item.market)
        }}
        className="absolute right-1 top-1 hidden text-[10px] text-faint hover:text-up group-hover:block"
        title="移除"
      >
        ✕
      </button>
    </div>
  )
}
