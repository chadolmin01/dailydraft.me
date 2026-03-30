'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface OnboardingComboBoxProps {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}

export const OnboardingComboBox: React.FC<OnboardingComboBoxProps> = ({
  value, onChange, options, placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : options.slice(0, 6)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center bg-surface-card rounded-xl border border-border focus-within:border-surface-inverse focus-within:bg-white transition-all">
        <input
          type="text"
          value={isOpen ? search || value : value}
          onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); if (!isOpen) setIsOpen(true) }}
          onFocus={() => { setIsOpen(true); setSearch(value) }}
          placeholder={placeholder}
          maxLength={50}
          className="flex-1 px-3.5 py-2.5 text-sm font-medium bg-transparent focus:outline-none placeholder:text-txt-tertiary min-w-0"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="pr-3 text-txt-secondary hover:text-txt-primary transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface-card rounded-lg border border-border shadow-md max-h-36 overflow-y-auto">
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setSearch(''); setIsOpen(false) }}
              className={`w-full text-left px-3.5 py-2 text-sm hover:bg-surface-sunken transition-colors ${
                value === opt ? 'text-black font-semibold bg-surface-sunken' : 'text-txt-secondary'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
