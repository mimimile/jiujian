import { useCallback, useEffect, useState } from 'react'
import type { Market } from '@shared/types'

export interface WatchItem {
  symbol: string
  market: Market
}

const KEY = 'jj.watchlist'

function load(): WatchItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? (arr as WatchItem[]) : []
  } catch {
    return []
  }
}

export function useWatchlist(): {
  items: WatchItem[]
  add: (it: WatchItem) => void
  remove: (symbol: string, market: Market) => void
  has: (symbol: string, market: Market) => boolean
} {
  const [items, setItems] = useState<WatchItem[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items))
    } catch {
      // 忽略持久化失败
    }
  }, [items])

  const has = useCallback(
    (symbol: string, market: Market) =>
      items.some((i) => i.symbol === symbol && i.market === market),
    [items]
  )

  const add = useCallback((it: WatchItem) => {
    if (!it.symbol) return
    setItems((prev) =>
      prev.some((i) => i.symbol === it.symbol && i.market === it.market) ? prev : [...prev, it]
    )
  }, [])

  const remove = useCallback((symbol: string, market: Market) => {
    setItems((prev) => prev.filter((i) => !(i.symbol === symbol && i.market === market)))
  }, [])

  return { items, add, remove, has }
}
