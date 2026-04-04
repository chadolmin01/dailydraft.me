'use client'

import { useState, useEffect, useRef } from 'react'
import { TRAIT_COLORS } from './types'

export function SliderBar({ value: rawValue, low, high, label, colorKey }: { value: number; low: string; high: string; label: string; colorKey?: string }) {
  // 기존 1-10 데이터 호환: 5 초과면 반으로 나눠서 1-5로 보정
  const value = rawValue > 5 ? Math.round(rawValue / 2) : rawValue
  const pct = Math.min(Math.max((value / 5) * 100, 10), 100)
  const colors = (colorKey && TRAIT_COLORS[colorKey]) || { bar: 'bg-neutral-500', barBg: 'bg-neutral-100', dot: 'bg-neutral-500', text: 'text-neutral-600', accent: 'neutral' }
  const [animated, setAnimated] = useState(false)
  const [hovering, setHovering] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Interpret value
  const getInterpretation = () => {
    if (value <= 2) return low
    if (value >= 4) return high
    return '보통'
  }

  return (
    <div
      className="group relative rounded-xl px-3 py-2.5 hover:bg-surface-sunken/50 transition-all cursor-default"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-txt-primary flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot} ring-2 ring-offset-1 ${hovering ? 'ring-current scale-125' : 'ring-transparent'} transition-all`} style={{ color: `var(--tw-${colors.accent}-200, transparent)` }} />
          {label}
        </span>
        <span className={`text-xs font-bold tabular-nums ${colors.text} transition-colors`}>
          {value}<span className="text-txt-tertiary font-normal">/5</span>
        </span>
      </div>

      <div ref={barRef} className={`relative h-2.5 ${colors.barBg} rounded-full overflow-hidden`}>
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: animated ? `${pct}%` : '0%' }}
        />
        {/* Thumb indicator */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${colors.bar} rounded-full border-2 border-white shadow-md transition-all duration-700 ease-out ${hovering ? 'scale-125 shadow-lg' : ''}`}
          style={{ left: animated ? `calc(${pct}% - 7px)` : '-7px' }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className={`text-[10px] font-medium ${value <= 2 ? colors.text + ' font-bold' : 'text-txt-tertiary'} transition-colors`}>{low}</span>
        <span className={`text-[10px] font-medium ${value >= 4 ? colors.text + ' font-bold' : 'text-txt-tertiary'} transition-colors`}>{high}</span>
      </div>

      {/* Hover tooltip */}
      {hovering && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-surface-inverse text-txt-inverse text-[10px] font-medium rounded-lg shadow-lg whitespace-nowrap z-10 animate-[fadeIn_0.15s_ease-out]">
          {getInterpretation()} ({value}점)
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--surface-inverse)]" />
        </div>
      )}
    </div>
  )
}
