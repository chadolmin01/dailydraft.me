'use client'

import React, { useState } from 'react'
import { Check } from 'lucide-react'
import type { QuickNumberPreset } from '@/src/lib/onboarding/types'

interface QuickNumberProps {
  presets: QuickNumberPreset[]
  unit: string
  subQuestion?: { question: string; yesLabel: string; noLabel: string }
  onConfirm: (value: number, subAnswer?: boolean) => void
}

export const QuickNumber: React.FC<QuickNumberProps> = ({ presets, unit, subQuestion, onConfirm }) => {
  const [selected, setSelected] = useState<number | null>(null)
  const [subAnswer, setSubAnswer] = useState<boolean | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const canConfirm = selected !== null && (!subQuestion || subAnswer !== null)

  const handleConfirm = () => {
    if (!canConfirm || confirmed) return
    setConfirmed(true)
    setTimeout(() => onConfirm(selected!, subAnswer ?? undefined), 300)
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset, i) => (
          <button
            key={preset.value}
            onClick={() => !confirmed && setSelected(preset.value)}
            disabled={confirmed}
            className={`ob-chip px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all duration-200 ${
              selected === preset.value
                ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                : confirmed
                  ? 'bg-surface-sunken border-border opacity-40'
                  : 'bg-surface-card border-border hover:border-surface-inverse text-txt-primary'
            }`}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Selected indicator */}
      {selected !== null && (
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-mono text-txt-tertiary">
            주 {selected}{unit === '시간/주' ? '시간' : unit}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* Sub question */}
      {subQuestion && selected !== null && !confirmed && (
        <div className="ob-chip" style={{ animationDelay: '200ms' }}>
          <p className="text-[12px] text-txt-secondary font-medium mb-2">{subQuestion.question}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSubAnswer(true)}
              className={`px-3 py-2.5 rounded-xl border text-[13px] font-bold transition-all duration-200 ${
                subAnswer === true
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card border-border hover:border-surface-inverse text-txt-primary'
              }`}
            >
              {subQuestion.yesLabel}
            </button>
            <button
              onClick={() => setSubAnswer(false)}
              className={`px-3 py-2.5 rounded-xl border text-[13px] font-bold transition-all duration-200 ${
                subAnswer === false
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'bg-surface-card border-border hover:border-surface-inverse text-txt-primary'
              }`}
            >
              {subQuestion.noLabel}
            </button>
          </div>
        </div>
      )}

      {/* Confirm */}
      {!confirmed && (
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="ob-hover flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-[12px] font-bold rounded-lg hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40"
          >
            <Check size={12} />
            확인
          </button>
        </div>
      )}
    </div>
  )
}
