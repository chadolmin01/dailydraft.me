'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Cursor 스타일 모델 선택기. 입력창 아래에 작게 노출.
 * - 클릭 → 드롭다운 (라벨 + 비용·속도 힌트)
 * - 선택 → localStorage 에 저장 (persistent across reloads)
 * - 챗 send 시 body.model 로 전달
 */

interface Model {
  id: string
  label: string
  hint: string
}

interface ModelPickerProps {
  models: readonly Model[]
  value: string
  onChange: (id: string) => void
}

export function ModelPicker({ models, value, onChange }: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = models.find(m => m.id === value) ?? models[0]

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(s => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-caption text-muted-soft hover:text-ink transition-colors px-1.5 py-0.5 rounded"
      >
        <span className="tabular">{current.label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute bottom-full mb-1 left-0 min-w-[180px] rounded-lg border border-hairline bg-canvas shadow-lg py-1 z-30 chat-bubble-in"
        >
          {models.map(m => {
            const active = m.id === value
            return (
              <button
                key={m.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(m.id)
                  setOpen(false)
                }}
                className="w-full px-3 py-2 flex items-start gap-2 text-left hover:bg-surface-soft transition-colors"
              >
                <span className={`w-3 mt-0.5 shrink-0 ${active ? 'text-ink' : 'text-transparent'}`}>
                  <Check size={12} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-sm text-ink">{m.label}</span>
                  <span className="block text-caption text-muted-soft">{m.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
