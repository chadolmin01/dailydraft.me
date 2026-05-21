'use client'

import React, { useState } from 'react'

interface SpectrumPickProps {
  leftLabel: string
  leftDescription: string
  rightLabel: string
  rightDescription: string
  points: number
  comments?: string[]
  onChange: (value: number, ready: boolean) => void
}

export const SpectrumPick: React.FC<SpectrumPickProps> = ({
  leftLabel, leftDescription, rightLabel, rightDescription, points, comments, onChange,
}) => {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (value: number) => {
    setSelected(value)
    onChange(value, true)
  }

  const pointValues = Array.from({ length: points }, (_, i) => i + 1)

  return (
    <div>
      {/* Spectrum bar */}
      <div className="relative py-2">
        {/* Track — clipped to node centers so line doesn't overshoot */}
        <div
          className="absolute top-1/2 h-1 rounded-full -translate-y-1/2 bg-border"
          style={{ left: 'calc(24px)', right: 'calc(24px)' }}
        />

        {/* Fill */}
        {selected !== null && (
          <div
            className="absolute top-1/2 h-1 bg-brand rounded-full -translate-y-1/2 transition-all duration-300"
            style={{
              left: 'calc(24px)',
              width: `calc((100% - 48px) * ${(selected - 1) / (points - 1)})`,
            }}
          />
        )}

        {/* Points — z-10 so nodes render above the track line */}
        <div className="relative z-10 flex justify-between px-0">
          {pointValues.map((value) => {
            const isSelected = selected === value
            const isPast = selected !== null && value < selected

            return (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={`relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-[0.92] ${
                  isSelected
                    ? 'bg-brand border-brand scale-105 shadow-sm'
                    : isPast
                      ? 'bg-brand border-brand'
                      : 'bg-surface-card border-border hover:border-brand'
                }`}
              >
                <span className={`text-[12px] font-bold ${
                  isSelected || isPast ? 'text-white' : 'text-txt-disabled'
                }`}>
                  {value}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Comment — always present to keep layout stable */}
      {comments && comments.length > 0 && (
        <div className="text-center mt-4">
          <span className={`inline-block px-4 py-2 bg-surface-sunken rounded-full text-[13px] font-medium transition-colors duration-200 ${
            selected !== null ? 'text-txt-primary' : 'text-txt-disabled'
          }`}>
            {selected !== null ? comments[selected - 1] : '선택해주세요'}
          </span>
        </div>
      )}

      {/* Labels */}
      <div className="flex justify-between mt-3 px-1">
        <div className={`text-left transition-colors duration-300 ${selected !== null && selected <= 2 ? 'text-brand' : 'text-txt-secondary'}`}>
          <div className="text-[13px] font-bold">{leftLabel}</div>
          <div className="text-[11px] leading-relaxed whitespace-pre-line mt-0.5 text-txt-tertiary">{leftDescription}</div>
        </div>
        <div className={`text-right transition-colors duration-300 ${selected !== null && selected >= 4 ? 'text-brand' : 'text-txt-secondary'}`}>
          <div className="text-[13px] font-bold">{rightLabel}</div>
          <div className="text-[11px] leading-relaxed whitespace-pre-line mt-0.5 text-txt-tertiary">{rightDescription}</div>
        </div>
      </div>
    </div>
  )
}
