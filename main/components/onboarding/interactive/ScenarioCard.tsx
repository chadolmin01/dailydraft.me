'use client'

import React, { useState } from 'react'
import { Search, MessageCircle, ClipboardList, Zap, Shield, Users } from 'lucide-react'
import type { ScenarioOption } from '@/src/lib/onboarding/types'

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Search, MessageCircle, ClipboardList, Zap, Shield, Users,
}

interface ScenarioCardProps {
  options: ScenarioOption[]
  onSelect: (option: ScenarioOption) => void
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ options, onSelect }) => {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (option: ScenarioOption) => {
    if (selected) return
    setSelected(option.id)
    setTimeout(() => onSelect(option), 400)
  }

  return (
    <div className="mt-3 space-y-2">
      {options.map((option, i) => {
        const Icon = ICON_MAP[option.icon] || Zap
        const isSelected = selected === option.id
        const isDimmed = selected !== null && !isSelected

        return (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            disabled={selected !== null}
            className={`ob-chip ob-hover w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 ${
              isSelected
                ? 'bg-surface-inverse text-txt-inverse border-surface-inverse scale-[0.98]'
                : isDimmed
                  ? 'bg-surface-sunken border-border opacity-40 scale-[0.97]'
                  : 'bg-surface-card border-border hover:border-surface-inverse'
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-white/15' : 'bg-surface-sunken'
              }`}>
                <Icon size={16} className={isSelected ? 'text-white' : 'text-txt-secondary'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-bold ${isSelected ? '' : 'text-txt-primary'}`}>
                  {option.label}
                </div>
                <div className={`text-[11px] mt-0.5 whitespace-pre-line leading-relaxed ${
                  isSelected ? 'text-white/70' : 'text-txt-tertiary'
                }`}>
                  {option.description}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
