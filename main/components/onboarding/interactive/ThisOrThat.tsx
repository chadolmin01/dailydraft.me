'use client'

import React, { useState } from 'react'
import type { ThisOrThatOption } from '@/src/lib/onboarding/types'

interface ThisOrThatProps {
  optionA: ThisOrThatOption
  optionB: ThisOrThatOption
  onChange: (option: ThisOrThatOption, ready: boolean) => void
}

export const ThisOrThat: React.FC<ThisOrThatProps> = ({ optionA, optionB, onChange }) => {
  const [selected, setSelected] = useState<ThisOrThatOption | null>(null)

  const handleSelect = (option: ThisOrThatOption) => {
    setSelected(option)
    onChange(option, true)
  }

  const comment = selected
    ? selected.description?.replace(/\n/g, ' ')
    : '직감대로 골라주세요'

  const renderPill = (option: ThisOrThatOption, delay: number) => {
    const isSelected = selected?.id === option.id

    return (
      <button
        key={option.id}
        onClick={() => handleSelect(option)}
        className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] ${
          isSelected
            ? 'bg-brand border-brand'
            : 'bg-surface-card border-border hover:border-brand'
        }`}
        style={{
          animation: 'ob-chip-in 0.35s cubic-bezier(0.34,1.4,0.64,1) both',
          animationDelay: `${delay}ms`,
        }}
      >
        <span className="text-2xl leading-none">{option.emoji}</span>
        <span className={`text-[15px] font-bold ${isSelected ? 'text-white' : 'text-txt-primary'}`}>
          {option.label}
        </span>
      </button>
    )
  }

  return (
    <div>
      <p className="text-[13px] text-txt-secondary text-center mt-2 mb-[28px] transition-all duration-200">
        {comment}
      </p>
      <div className="flex gap-3">
        {renderPill(optionA, 0)}
        {renderPill(optionB, 60)}
      </div>
    </div>
  )
}
