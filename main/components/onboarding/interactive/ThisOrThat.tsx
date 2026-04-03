'use client'

import React, { useState } from 'react'
import type { ThisOrThatOption } from '@/src/lib/onboarding/types'

interface ThisOrThatProps {
  optionA: ThisOrThatOption
  optionB: ThisOrThatOption
  onSelect: (option: ThisOrThatOption) => void
}

export const ThisOrThat: React.FC<ThisOrThatProps> = ({ optionA, optionB, onSelect }) => {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (option: ThisOrThatOption) => {
    if (selected) return
    setSelected(option.id)
    setTimeout(() => onSelect(option), 400)
  }

  const renderCard = (option: ThisOrThatOption, delay: number) => {
    const isSelected = selected === option.id
    const isDimmed = selected !== null && !isSelected

    return (
      <button
        key={option.id}
        onClick={() => handleSelect(option)}
        disabled={selected !== null}
        className={`ob-chip ob-hover flex-1 flex flex-col items-center justify-center text-center px-4 py-5 rounded-xl border transition-all duration-300 ${
          isSelected
            ? 'bg-surface-inverse text-txt-inverse border-surface-inverse scale-[0.97]'
            : isDimmed
              ? 'bg-surface-sunken border-border opacity-40 scale-[0.95]'
              : 'bg-surface-card border-border hover:border-surface-inverse'
        }`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <span className="text-2xl mb-2">{option.emoji}</span>
        <span className={`text-[14px] font-bold ${isSelected ? '' : 'text-txt-primary'}`}>
          {option.label}
        </span>
        <span className={`text-[11px] mt-1 whitespace-pre-line leading-relaxed ${
          isSelected ? 'text-white/70' : 'text-txt-tertiary'
        }`}>
          {option.description}
        </span>
      </button>
    )
  }

  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 gap-2">
        {renderCard(optionA, 0)}
        {renderCard(optionB, 80)}
      </div>
      {!selected && (
        <p className="text-center text-[10px] text-txt-disabled font-mono mt-2">
          하나를 선택해주세요
        </p>
      )}
    </div>
  )
}
