'use client'

import React from 'react'
import { useScrollReveal } from '@/src/hooks/useScrollReveal'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function ScrollReveal({ children, className = '', delay }: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={`${isVisible ? 'reveal-visible' : 'reveal-hidden'} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
