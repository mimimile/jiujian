import { useState } from 'react'
import type { AutoRecapSettings } from '../hooks/useAutoRecap'

interface Props {
  settings: AutoRecapSettings
  setEnabled: (v: boolean) => void
  setTime: (t: string) => void
}

export function SettingsPopover({ settings, setEnabled, setTime }: Props): JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="设置"
        className={`rounded-full border px-2 py-1 text-xs transition-colors ${
          settings.enabled
            ? 'border-gold/50 text-gold'
            : 'border-line text-muted hover:border-line-2 hover:text-text'
        }`}
      >
        ⚙
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-64 rounded-md border border-line bg-panel p-3 shadow-2xl">
            <div className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted">设置 · SETTINGS</div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-text">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="accent-[var(--color-gold)]"
              />
              收盘后自动复盘
            </label>
            <div className="mt-2.5 flex items-center gap-2 text-xs text-muted">
              <span>触发时间</span>
              <input
                type="time"
                value={settings.time}
                onChange={(e) => setTime(e.target.value)}
                className="nums rounded-sm border border-line bg-ink px-2 py-1 text-text outline-none focus:border-gold/60"
              />
            </div>
            <div className="cjk mt-2.5 leading-relaxed text-[10px] text-faint">
              仅当应用保持开启时触发（周一~周五）。对全部自选股出一份复盘，每次约 $0.1，计入你的订阅额度。
            </div>
          </div>
        </>
      )}
    </div>
  )
}
