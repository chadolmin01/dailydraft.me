'use client'

import React from 'react'
import { SITUATION_OPTIONS } from '@/src/lib/onboarding/constants'

interface SituationStepProps {
  onSelect: (situation: typeof SITUATION_OPTIONS[number]) => void
}

export const SituationStep: React.FC<SituationStepProps> = ({ onSelect }) => {
  return (
    <div className="mt-3 space-y-1.5">
      {SITUATION_OPTIONS.map((sit, idx) => (
        <button
          key={sit.value}
          onClick={() => onSelect(sit)}
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
