'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface SortOption<T extends string> {
  id: T
  label: string
}

interface SortPillProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: SortOption<T>[]
}

/**
 * 인라인 정렬 드롭다운. 현재 선택값 + 드롭다운 옵션.
 * 필터 칩 오른쪽에 배치해서 한 줄에 필터+정렬을 보여준다.
 */
export function SortPill<T extends string>({ value, onChange, options }: SortPillProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = options.find(o => o.id === value) ?? options[0]

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border border-border bg-surface-card text-txt-primary hover:border-txt-tertiary transition-colors"
      >
        {current.label}
        <ChevronDown size={13} className={`text-txt-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-dropdown bg-surface-card border border-border rounded-xl shadow-md min-w-[120px] overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false) }}
              className={`w-full text-left px-3.5 py-2 text-[13px] transition-colors ${
                opt.id === value
                  ? 'bg-brand-bg text-brand font-semibold'
                  : 'text-txt-secondary hover:bg-surface-sunken'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
