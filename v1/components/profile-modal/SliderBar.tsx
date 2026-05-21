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

  const getInterpretation = () => {
    if (value <= 2) return low
    if (value >= 4) return high
    return '보통'
  }

  return (
    <div
      className="group relative rounded-2xl px-3.5 py-3 hover:bg-border-subtle transition-all cursor-default"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-semibold text-txt-primary flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot} transition-transform ${hovering ? 'scale-125' : ''}`} />
          {label}
        </span>
        {/* 숫자(x/5) 제거 — 양극 척도를 점수로 보이게 하는 오해 방지
           ("5가 더 좋다"는 착시). 위치/방향은 슬라이더 바 자체로 전달 */}
      </div>

      <div ref={barRef} className="relative h-2 bg-border-subtle rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: animated ? `${pct}%` : '0%' }}
        />
        {/* Thumb indicator */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${colors.bar} rounded-full border-2 border-surface-card shadow-md transition-all duration-700 ease-out ${hovering ? 'scale-125 shadow-lg' : ''}`}
          style={{ left: animated ? `calc(${pct}% - 7px)` : '-7px' }}
        />
      </div>

      <div className="flex justify-between mt-1.5">
        <span className={`text-[11px] font-medium ${value <= 2 ? colors.text + ' font-bold' : 'text-txt-tertiary'} transition-colors`}>{low}</span>
        <span className={`text-[11px] font-medium ${value >= 4 ? colors.text + ' font-bold' : 'text-txt-tertiary'} transition-colors`}>{high}</span>
      </div>

      {/* Hover tooltip */}
      {hovering && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-surface-inverse text-txt-inverse text-[11px] font-semibold rounded-xl shadow-lg whitespace-nowrap z-10 animate-[fadeIn_0.15s_ease-out]">
          {getInterpretation()}
        </div>
      )}
    </div>
  )
}
