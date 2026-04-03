'use client'

import React, { useEffect, useRef, useState } from 'react'

/* ── Section Label ── */
export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] font-mono uppercase tracking-wider text-txt-tertiary block mb-3">
    {children}
  </span>
)

/* ── Section Title ── */
export const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold text-txt-primary ${className}`}>
    {children}
  </h2>
)

/* ── Animated Counter (scroll-triggered) ── */
export const AnimatedCounter: React.FC<{
  target: number
  suffix?: string
  prefix?: string
  duration?: number
}> = ({ target, suffix = '', prefix = '', duration = 1600 }) => {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const start = performance.now()
          const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, hasAnimated])

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  )
}

/* ── Tab Pill ── */
export const TabPill: React.FC<{
  active: boolean
  onClick: () => void
  children: React.ReactNode
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
      active
        ? 'bg-surface-inverse text-txt-inverse shadow-sm'
        : 'border border-border text-txt-secondary hover:bg-surface-sunken'
    }`}
  >
    {children}
  </button>
)
