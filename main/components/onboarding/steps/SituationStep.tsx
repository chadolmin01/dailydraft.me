'use client'

import { SITUATION_OPTIONS } from '@/src/lib/onboarding/constants'

interface SituationStepProps {
  value: string
  attempted: boolean
  onSelect: (value: string) => void
}

export function SituationStep({ value, attempted, onSelect }: SituationStepProps) {
  const danger = attempted && !value
  return (
    <div className="space-y-2">
      {SITUATION_OPTIONS.map((sit, i) => {
        const active = value === sit.value
        return (
          <button
            key={sit.value}
            onClick={() => onSelect(sit.value)}
            aria-checked={active}
            role="radio"
            style={{ ['--stagger' as string]: `${i * 60}ms` }}
            className={`ob-stagger-item ob-ring-glow ob-press-spring w-full text-left px-5 py-4 border rounded-xl ${
              active
                ? 'bg-brand border-brand'
                : danger
                  ? 'bg-surface-card border-status-danger-text/50'
                  : 'bg-surface-card border-border'
            }`}
          >
            <div className={`text-[14px] font-bold ${active ? 'text-white' : 'text-txt-primary'}`}>
              {sit.label}
            </div>
            <div className={`text-[12px] mt-0.5 ${active ? 'text-white/70' : 'text-txt-tertiary'}`}>
              {sit.desc}
            </div>
          </button>
        )
      })}
    </div>
  )
}
