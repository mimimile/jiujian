import { useState } from 'react'
import Markdown from 'react-markdown'
import type { HistoryEntry } from '../hooks/useHistory'

interface Props {
  open: boolean
  items: HistoryEntry[]
  onClose: () => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function HistoryDrawer({ open, items, onClose, onRemove, onClear }: Props): JSX.Element | null {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  if (!open) return null
  const selected = items.find((x) => x.id === selectedId) ?? items[0] ?? null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="jj-reveal flex h-full w-[680px] max-w-[85vw] flex-col border-l border-line bg-panel shadow-2xl">
        <header className="flex items-center gap-2 border-b border-line px-4 py-2.5">
          <span className="text-[11px] font-medium tracking-[0.18em] text-muted">历史 · HISTORY</span>
          <span className="nums text-[11px] text-faint">{items.length}</span>
          <div className="ml-auto flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={onClear} className="text-[11px] text-faint hover:text-up">
                清空
              </button>
            )}
            <button onClick={onClose} className="text-muted hover:text-text">
              ✕
            </button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <div className="w-56 shrink-0 overflow-auto border-r border-line">
            {items.length === 0 ? (
              <div className="cjk p-3 text-[11px] leading-relaxed text-faint">
                暂无历史。每次分析或复盘后自动留存（最近 50 条）。
              </div>
            ) : (
              items.map((it) => {
                const active = selected != null && it.id === selected.id
                return (
                  <div
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className={`group relative cursor-pointer border-l-2 px-3 py-2 transition-colors ${
                      active ? 'border-gold bg-panel-2' : 'border-transparent hover:bg-panel-2/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] ${it.type === 'recap' ? 'text-gold' : 'text-muted'}`}>
                        {it.type === 'recap' ? '复盘' : '个股'}
                      </span>
                      <span className="cjk truncate text-xs text-text">{it.title}</span>
                    </div>
                    <div className="nums mt-0.5 text-[10px] text-faint">
                      {it.date}
                      {it.costUsd != null ? ` · $${it.costUsd.toFixed(3)}` : ''}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(it.id)
                      }}
                      className="absolute right-1 top-1 hidden text-[10px] text-faint hover:text-up group-hover:block"
                    >
                      ✕
                    </button>
                  </div>
                )
              })
            )}
          </div>
          <div className="flex-1 overflow-auto px-4 py-3">
            {selected ? (
              <div className="prose-jj">
                <Markdown>{selected.text}</Markdown>
              </div>
            ) : (
              <div className="grid h-full place-items-center text-xs text-faint">选择左侧条目查看</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
