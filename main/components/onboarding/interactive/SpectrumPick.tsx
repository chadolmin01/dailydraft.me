'use client'

import React, { useState } from 'react'

interface SpectrumPickProps {
  leftLabel: string
  leftDescription: string
  rightLabel: string
  rightDescription: string
  points: number
  onSelect: (value: number) => void
}

export const SpectrumPick: React.FC<SpectrumPickProps> = ({
  leftLabel, leftDescription, rightLabel, rightDescription, points, onSelect,
}) => {
  const [selected, setSelected] = useState<number | null>(null)

  const handleSelect = (value: number) => {
    if (selected !== null) return
    setSelected(value)
    setTimeout(() => onSelect(value), 400)
  }

  const pointValues = Array.from({ length: points }, (_, i) => i + 1)

  return (
    <div className="mt-3 ob-chip">
      {/* Anchors */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 text-left pr-2">
          <div className="text-[12px] font-bold text-txt-primary">{leftLabel}</div>
          <div className="text-[10px] text-txt-tertiary mt-0.5 whitespace-pre-line leading-relaxed">
            {leftDescription}
          </div>
        </div>
        <div className="flex-1 text-right pl-2">
          <div className="text-[12px] font-bold text-txt-primary">{rightLabel}</div>
          <div className="text-[10px] text-txt-tertiary mt-0.5 whitespace-pre-line leading-relaxed">
            {rightDescription}
          </div>
        </div>
      </div>

      {/* Spectrum line with points */}
      <div className="relative px-2">
        {/* Background line */}
        <div className="absolute top-1/2 left-2 right-2 h-px bg-border -translate-y-1/2" />

        {/* Filled line */}
        {selected !== null && (
          <div
            className="absolute top-1/2 left-2 h-0.5 bg-surface-inverse -translate-y-1/2 transition-all duration-300"
            style={{ width: `${((selected - 1) / (points - 1)) * 100}%` }}
          />
        )}

        {/* Points */}
        <div className="relative flex justify-between">
          {pointValues.map((value) => {
            const isSelected = selected === value
            const isPast = selected !== null && value <= selected

            return (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                disabled={selected !== null}
                className={`relative w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                  isSelected
                    ? 'bg-surface-inverse border-surface-inverse scale-110'
                    : isPast
                      ? 'bg-surface-inverse border-surface-inverse scale-90'
                      : selected !== null
                        ? 'bg-surface-sunken border-border opacity-40'
                        : 'bg-surface-card border-border hover:border-surface-inverse hover:scale-110'
                }`}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-txt-inverse">
                    {value}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between mt-2 px-1">
        {pointValues.map((value) => (
          <span key={value} className="text-[9px] font-mono text-txt-disabled w-8 text-center">
            {value}
          </span>
        ))}
      </div>
    </div>
  )
}
