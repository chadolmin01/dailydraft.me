'use client'

import React, { useRef, useCallback } from 'react'
import { POSITIONS } from '@/src/constants/roles'

interface PositionStepProps {
  onSelect: (position: string) => void
}

export const PositionStep: React.FC<PositionStepProps> = ({ onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')
    if (!buttons) return
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      next = (idx + 1) % buttons.length
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      next = (idx - 1 + buttons.length) % buttons.length
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(POSITIONS[idx].slug)
      return
    }
    if (next >= 0) buttons[next].focus()
  }, [onSelect])

  return (
    <div ref={containerRef} className="mt-3 flex flex-wrap gap-1.5" role="listbox" aria-label="포지션 선택">
      {POSITIONS.map((pos, idx) => (
        <button
          key={pos.slug}
          role="option"
          aria-selected={false}
          tabIndex={idx === 0 ? 0 : -1}
          onClick={() => onSelect(pos.slug)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="ob-chip ob-hover px-3.5 py-2 bg-surface-card rounded-lg border border-border text-[13px] font-medium text-txt-primary hover:bg-black hover:text-white"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          {pos.label}
        </button>
      ))}
    </div>
  )
}
