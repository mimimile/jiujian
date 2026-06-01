import type { Market } from '@shared/types'
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
    <div className="flex h-full w-52 shrink-0 flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="border-b border-[var(--color-line)] px-3 py-2 text-sm font-medium text-gray-200">
        自选股 <span className="text-xs text-gray-500">({items.length})</span>
      </div>
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="p-3 text-xs leading-relaxed text-gray-600">空。输入代码后点工具栏「☆ 自选」加入。</div>
        ) : (
          items.map((it) => {
            const active = it.symbol === current.symbol && it.market === current.market
            return (
              <div
                key={`${it.market}:${it.symbol}`}
                onClick={() => onSelect(it)}
                className={`group flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-panel-2)] ${
                  active ? 'bg-[var(--color-panel-2)]' : ''
                }`}
              >
                <span className="text-[10px] text-gray-500">{MARKET_LABEL[it.market]}</span>
                <span className="truncate text-gray-200">{it.symbol}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(it.symbol, it.market)
                  }}
                  className="ml-auto hidden text-gray-500 hover:text-[var(--color-up)] group-hover:block"
                  title="移除"
                >
                  ✕
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
