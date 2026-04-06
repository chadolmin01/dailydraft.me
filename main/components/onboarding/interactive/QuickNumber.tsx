'use client'

import React, { useState } from 'react'
import type { QuickNumberPreset } from '@/src/lib/onboarding/types'

interface QuickNumberProps {
  presets: QuickNumberPreset[]
  unit: string
  subQuestion?: { question: string; yesLabel: string; noLabel: string }
  onChange: (value: number | null, subAnswer: boolean | null, ready: boolean) => void
}

const HOUR_COMMENTS: { max: number; comment: string }[] = [
  { max: 5,   comment: '하루 1시간 정도네요. 가볍게 참여하는 스타일! 🌱' },
  { max: 10,  comment: '하루 2시간이에요. 꾸준히 할 수 있겠어요 👍' },
  { max: 15,  comment: '하루 2-3시간, 꽤 진지하게 임하는 편이네요 💪' },
  { max: 20,  comment: '하루 4시간 가까이요. 열정 넘치는 스타일! 🔥' },
  { max: Infinity, comment: '거의 풀타임급이에요. 대단하시다! 🚀' },
]

function getHourComment(value: number): string {
  return HOUR_COMMENTS.find(c => value <= c.max)?.comment ?? ''
}

export const QuickNumber: React.FC<QuickNumberProps> = ({ presets, subQuestion, onChange }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [subAnswer, setSubAnswer] = useState<boolean | null>(null)

  const selected = selectedIdx !== null ? presets[selectedIdx] : null

  const handlePresetClick = (i: number) => {
    setSelectedIdx(i)
    const value = presets[i].value
    const ready = !subQuestion || subAnswer !== null
    onChange(value, subAnswer, ready)
  }

  const handleSubAnswer = (val: boolean) => {
    setSubAnswer(val)
    if (selected) {
      onChange(selected.value, val, true)
    }
  }

  const pct = selectedIdx !== null ? (selectedIdx / (presets.length - 1)) * 100 : 0

  return (
    <div
      style={{
        animation: 'ob-chip-in 0.35s cubic-bezier(0.34,1.4,0.64,1) both',
      }}
    >
      {/* Comment */}
      <p key={selected?.value ?? 'default'} className="text-[13px] text-txt-secondary font-medium text-center mb-4 animate-in fade-in duration-200">
        {selected ? getHourComment(selected.value) : '주 40시간이면 풀타임이에요 😅'}
      </p>

      {/* Big value display */}
      <div className="flex items-end justify-center gap-1.5 mb-6">
        <span className={`text-[42px] font-black leading-none tabular-nums transition-all duration-200 ${selected ? 'text-txt-primary' : 'text-border'}`}>
          {selected ? selected.label : '?'}
        </span>
        <span className={`text-[14px] font-semibold mb-1.5 transition-colors duration-200 ${selected ? 'text-txt-tertiary' : 'text-border'}`}>
          시간/주
        </span>
      </div>

      {/* Segmented gauge */}
      <div className="relative">
        <div className="h-4 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300 ease-out"
            style={{ width: selectedIdx !== null ? `${pct}%` : '0%' }}
          />
        </div>

        <div className="absolute inset-0 flex">
          {presets.map((_, i) => (
            <button
              key={i}
              onClick={() => handlePresetClick(i)}
              className="flex-1 h-full"
              aria-label={presets[i].label}
            />
          ))}
        </div>

        {selectedIdx !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-brand rounded-full border-[3px] border-white shadow-md transition-all duration-300 pointer-events-none"
            style={{ left: `${pct}%` }}
          />
        )}
      </div>

      {/* Preset labels */}
      <div className="flex justify-between mt-2.5 px-0.5">
        {presets.map((p, i) => (
          <button
            key={p.value}
            onClick={() => handlePresetClick(i)}
            className={`text-[11px] font-mono transition-all duration-200 ${
              selectedIdx === i ? 'text-brand font-bold' : 'text-txt-disabled'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sub question — 미리 공간 확보해서 레이아웃 시프트 방지 */}
      {subQuestion && (
        <div className={`mt-6 transition-all duration-300 ${selected !== null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          <p className="text-[13px] font-semibold text-txt-secondary mb-3">{subQuestion.question}</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { val: true, label: subQuestion.yesLabel },
              { val: false, label: subQuestion.noLabel },
            ].map(({ val, label }) => (
              <button
                key={String(val)}
                onClick={() => handleSubAnswer(val)}
                className={`py-3.5 rounded-xl border-2 text-[14px] font-black transition-all duration-200 active:scale-[0.97] ${
                  subAnswer === val
                    ? 'bg-brand border-brand text-white'
                    : 'bg-surface-card border-border hover:border-brand text-txt-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
