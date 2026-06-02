import { useCallback, useState } from 'react'

export type HistoryType = 'analysis' | 'recap'

export interface HistoryEntry {
  id: string
  type: HistoryType
  title: string
  date: string
  text: string
  costUsd: number | null
}

const KEY = 'jj.history'
const CAP = 50

function load(): HistoryEntry[] {
  try {
    const r = localStorage.getItem(KEY)
    const arr = r ? (JSON.parse(r) as unknown) : []
    return Array.isArray(arr) ? (arr as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function persist(items: HistoryEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* ignore（超额时静默） */
  }
}

export function useHistory(): {
  items: HistoryEntry[]
  add: (e: Omit<HistoryEntry, 'id' | 'date'>) => void
  remove: (id: string) => void
  clear: () => void
} {
  const [items, setItems] = useState<HistoryEntry[]>(load)

  const add = useCallback((e: Omit<HistoryEntry, 'id' | 'date'>) => {
    setItems((prev) => {
      const entry: HistoryEntry = {
        ...e,
        id: `${new Date().getTime()}-${prev.length}`,
        date: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      const next = [entry, ...prev].slice(0, CAP)
      persist(next)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id)
      persist(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    persist([])
  }, [])

  return { items, add, remove, clear }
}
