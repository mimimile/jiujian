import { useCallback, useEffect, useRef, useState } from 'react'
import type { Market } from '@shared/types'
import type { StreamState } from './useClaudeStream'

export interface AutoRecapSettings {
  enabled: boolean
  /** 'HH:MM' 24 小时制 */
  time: string
}

const KEY = 'jj.autorecap'
const FIRED_KEY = 'jj.autorecap.fired'

function load(): AutoRecapSettings {
  try {
    const r = localStorage.getItem(KEY)
    if (r) return { enabled: false, time: '15:05', ...(JSON.parse(r) as Partial<AutoRecapSettings>) }
  } catch {
    /* ignore */
  }
  return { enabled: false, time: '15:05' }
}

function persist(s: AutoRecapSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

function notify(title: string, body: string): void {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    } else if (Notification.permission !== 'denied') {
      void Notification.requestPermission().then((p) => {
        if (p === 'granted') new Notification(title, { body })
      })
    }
  } catch {
    /* ignore */
  }
}

interface Opts {
  ready: boolean
  items: Array<{ symbol: string; market: Market }>
  recap: (items: Array<{ symbol: string; market: Market }>) => Promise<void>
  state: StreamState
}

/**
 * 收盘后自动复盘：app 开启时，工作日到达设定时间自动触发一次复盘 + 系统通知。
 * 注：依赖 app 保持开启（无后台常驻）。每天每个设定时间只触发一次（localStorage 标记）。
 */
export function useAutoRecap({ ready, items, recap, state }: Opts): {
  settings: AutoRecapSettings
  setEnabled: (v: boolean) => void
  setTime: (t: string) => void
} {
  const [settings, setSettings] = useState<AutoRecapSettings>(load)
  const pendingRef = useRef(false)
  const latest = useRef({ ready, items, recap, settings })
  latest.current = { ready, items, recap, settings }

  useEffect(() => {
    const id = window.setInterval(() => {
      const cur = latest.current
      if (!cur.settings.enabled || !cur.ready || cur.items.length === 0) return
      const now = new Date()
      const day = now.getDay()
      if (day === 0 || day === 6) return // 周末不触发
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      if (`${hh}:${mm}` !== cur.settings.time) return
      const mark = `${now.toDateString()} ${cur.settings.time}`
      if (localStorage.getItem(FIRED_KEY) === mark) return
      localStorage.setItem(FIRED_KEY, mark)
      pendingRef.current = true
      notify('韭见 · 盘后复盘', '正在生成今日自选股复盘…')
      void cur.recap(cur.items)
    }, 20000)
    return () => window.clearInterval(id)
  }, [])

  // 自动复盘完成 → 通知
  useEffect(() => {
    if (pendingRef.current && !state.running && (state.text || state.error)) {
      pendingRef.current = false
      notify(
        '韭见 · 盘后复盘已生成',
        state.error ? '复盘失败，请打开应用查看' : '今日自选股复盘已就绪'
      )
    }
  }, [state.running, state.text, state.error])

  const setEnabled = useCallback((v: boolean) => {
    setSettings((s) => {
      const n = { ...s, enabled: v }
      persist(n)
      return n
    })
  }, [])
  const setTime = useCallback((t: string) => {
    setSettings((s) => {
      const n = { ...s, time: t || '15:05' }
      persist(n)
      return n
    })
  }, [])

  return { settings, setEnabled, setTime }
}
