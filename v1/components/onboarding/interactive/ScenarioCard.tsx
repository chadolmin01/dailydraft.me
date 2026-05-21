'use client'

import React, { useState } from 'react'
import { Search, MessageCircle, ClipboardList, Zap, Shield, Users } from 'lucide-react'
import type { ScenarioOption } from '@/src/lib/onboarding/types'

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Search, MessageCircle, ClipboardList, Zap, Shield, Users,
}

interface ScenarioCardProps {
  options: ScenarioOption[]
  onChange: (option: ScenarioOption, ready: boolean) => void
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ options, onChange }) => {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (option: ScenarioOption) => {
    setSelected(option.id)
    onChange(option, true)
  }

  return (
    <div className="mt-3 space-y-2">
      {options.map((option, i) => {
        const Icon = ICON_MAP[option.icon] || Zap
        const isSelected = selected === option.id

        return (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            className={`ob-chip ob-hover w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-300 ${
              isSelected
                ? 'bg-brand text-white border-brand scale-[0.98]'
                : 'bg-surface-card border-border hover:border-brand'
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
                  isSelected ? 'text-white' : 'text-txt-tertiary'
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
