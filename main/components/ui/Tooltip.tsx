'use client'

import React from 'react'

interface TooltipProps {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
  className?: string
}

export function Tooltip({ text, children, position = 'top', className = '' }: TooltipProps) {
  const positionClasses = position === 'top'
    ? 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2'
    : 'top-[calc(100%+6px)] left-1/2 -translate-x-1/2'

  return (
    <span className={`tooltip-container inline-flex ${className}`}>
      {children}
      <span
        className={`tooltip-content ${positionClasses} px-2 py-1 text-[0.625rem] font-medium bg-surface-inverse text-txt-inverse rounded-md shadow-lg`}
      >
        {text}
        <span
          className={`absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-surface-inverse rotate-45 ${
            position === 'top' ? '-bottom-[3px]' : '-top-[3px]'
          }`}
        />
      </span>
    </span>
  )
}
