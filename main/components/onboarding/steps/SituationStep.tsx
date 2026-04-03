'use client'

import React, { useRef, useCallback } from 'react'
import { SITUATION_OPTIONS } from '@/src/lib/onboarding/constants'

interface SituationStepProps {
  onSelect: (situation: typeof SITUATION_OPTIONS[number]) => void
}

export const SituationStep: React.FC<SituationStepProps> = ({ onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')
    if (!buttons) return
    let next = -1
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      next = (idx + 1) % buttons.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      next = (idx - 1 + buttons.length) % buttons.length
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(SITUATION_OPTIONS[idx])
      return
    }
    if (next >= 0) buttons[next].focus()
  }, [onSelect])

  return (
    <div ref={containerRef} className="mt-3 space-y-1.5" role="listbox" aria-label="현재 상황 선택">
      {SITUATION_OPTIONS.map((sit, idx) => (
        <button
          key={sit.value}
          role="option"
          aria-selected={false}
          tabIndex={idx === 0 ? 0 : -1}
          onClick={() => onSelect(sit)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="ob-chip ob-hover w-full text-left px-4 py-3 bg-surface-card rounded-xl border border-border hover:border-border transition-all group"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="text-[13px] font-bold text-txt-primary group-hover:text-black">{sit.label}</div>
          <div className="text-[11px] text-txt-tertiary mt-0.5 font-mono">{sit.desc}</div>
        </button>
      ))}
    </div>
  )
}
