'use client'

import React from 'react'
import { POSITION_OPTIONS } from '@/src/lib/onboarding/constants'

interface PositionStepProps {
  onSelect: (position: string) => void
}

export const PositionStep: React.FC<PositionStepProps> = ({ onSelect }) => {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {POSITION_OPTIONS.map((pos, idx) => (
        <button
          key={pos}
          onClick={() => onSelect(pos)}
          className="ob-chip ob-hover px-3.5 py-2 bg-surface-card rounded-lg border border-border text-[13px] font-medium text-txt-primary hover:bg-black hover:text-white"
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          {pos}
        </button>
      ))}
    </div>
  )
}
