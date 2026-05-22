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
      className="group w-full text-left rounded-2xl border border-hairline bg-canvas px-4 py-3 hover:border-muted hover:bg-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-surface-soft border border-hairline grid place-items-center shrink-0 text-muted group-hover:text-ink transition-colors">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-ink">{label}</p>
          {description ? (
            <p className="text-caption text-muted-soft mt-0.5">{description}</p>
          ) : null}
        </div>
        <ArrowUpRight
          size={14}
          className="text-muted-soft opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
        />
      </div>
    </button>
  )
}
