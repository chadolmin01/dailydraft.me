'use client'

import React, { useState } from 'react'
import { Check } from 'lucide-react'
import type { EmojiGridOption } from '@/src/lib/onboarding/types'

interface EmojiGridProps {
  options: EmojiGridOption[]
  minSelect: number
  maxSelect: number
  onConfirm: (selected: EmojiGridOption[]) => void
}

export const EmojiGrid: React.FC<EmojiGridProps> = ({ options, minSelect, maxSelect, onConfirm }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)

  const toggleOption = (id: string) => {
    if (confirmed) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < maxSelect) {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size < minSelect || confirmed) return
    setConfirmed(true)
    const selectedOptions = options.filter(o => selected.has(o.id))
    setTimeout(() => onConfirm(selectedOptions), 300)
  }

  const cols = options.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="mt-3">
      <div className={`grid ${cols} gap-2`}>
        {options.map((option, i) => {
          const isSelected = selected.has(option.id)
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              disabled={confirmed}
              className={`ob-chip relative flex flex-col items-center justify-center px-3 py-3.5 rounded-xl border transition-all duration-200 ${
                confirmed && !isSelected
                  ? 'bg-surface-sunken border-border opacity-40'
                  : isSelected
                    ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                    : 'bg-surface-card border-border hover:border-surface-inverse'
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                  <Check size={10} className="text-black" />
                </div>
              )}
              <span className="text-xl mb-1">{option.emoji}</span>
              <span className={`text-[11px] font-medium ${
                isSelected ? '' : 'text-txt-primary'
              }`}>
                {option.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[10px] text-txt-disabled font-mono">
          {selected.size}/{maxSelect} 선택{selected.size < minSelect ? ` · 최소 ${minSelect}개` : ''}
        </span>
        {!confirmed && (
          <button
            onClick={handleConfirm}
            disabled={selected.size < minSelect}
            className="ob-hover flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-[12px] font-bold rounded-lg hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40"
          >
            <Check size={12} />
            확인
          </button>
        )}
      </div>
    </div>
  )
}
