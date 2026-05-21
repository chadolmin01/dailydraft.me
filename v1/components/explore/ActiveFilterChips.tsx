'use client'

import React from 'react'
import { X } from 'lucide-react'
import type { ActiveFilterChip } from './types'

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[]
  onClearAll: () => void
}

export function ActiveFilterChips({ chips, onClearAll }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 mb-4 overflow-x-auto scrollbar-hide mask-fade-r">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-surface-inverse text-txt-inverse rounded-xl transition-opacity hover:opacity-80"
        >
          {chip.label}
          <X size={12} />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="shrink-0 px-3 py-1.5 text-xs font-bold text-txt-tertiary hover:text-txt-secondary transition-colors"
        >
          전체 초기화
        </button>
      )}
    </div>
  )
}
