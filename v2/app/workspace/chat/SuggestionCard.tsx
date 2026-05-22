'use client'

import { ArrowUpRight } from 'lucide-react'

interface SuggestionCardProps {
  icon: React.ReactNode
  label: string
  description?: string
  onClick: () => void
  disabled?: boolean
}

export function SuggestionCard({ icon, label, description, onClick, disabled }: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group w-full text-left rounded-2xl border border-hairline-dark bg-surface-dark-soft px-4 py-3 hover:border-on-dark-soft hover:bg-surface-dark-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-surface-dark-elevated border border-hairline-dark grid place-items-center shrink-0 text-on-dark-soft group-hover:text-on-dark transition-colors">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-on-dark">{label}</p>
          {description ? (
            <p className="text-caption text-on-dark-soft mt-0.5">{description}</p>
          ) : null}
        </div>
        <ArrowUpRight
          size={14}
          className="text-on-dark-soft opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
        />
      </div>
    </button>
  )
}
