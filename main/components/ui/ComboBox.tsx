'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface ComboBoxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  label?: string
  className?: string
  maxLength?: number
}

export const ComboBox: React.FC<ComboBoxProps> = ({
  value,
  onChange,
  options,
  placeholder = '검색 또는 직접 입력',
  className = '',
  maxLength = 50,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : options.slice(0, 8)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (opt: string) => {
    onChange(opt)
    setSearch('')
    setIsOpen(false)
  }

  const handleInputChange = (text: string) => {
    setSearch(text)
    onChange(text)
    if (!isOpen) setIsOpen(true)
  }

  const handleClear = () => {
    onChange('')
    setSearch('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center border border-border bg-surface-card rounded-lg focus-within:border-accent transition-colors">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search || value : value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsOpen(true)
            setSearch(value)
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          className="flex-1 px-3 py-2.5 text-base sm:text-sm bg-transparent focus:outline-none placeholder:text-txt-disabled min-w-0"
        />
        {value && (
          <button onClick={handleClear} className="p-3 sm:p-1.5 text-txt-disabled hover:text-txt-secondary transition-colors">
            <X size={12} />
          </button>
        )}
        <button
          onClick={() => { setIsOpen(!isOpen); if (!isOpen) inputRef.current?.focus() }}
          className="p-1.5 pr-2.5 text-txt-disabled hover:text-txt-secondary transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface-card rounded-lg border border-border shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-sunken transition-colors ${
                value === opt ? 'text-brand font-medium bg-brand-bg' : 'text-txt-secondary'
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
