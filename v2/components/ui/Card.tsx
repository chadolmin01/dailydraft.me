'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: string
  title?: string
  action?: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'technical' | 'flat' | 'solid'
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'p-6',
  title,
  action,
  onClick,
  variant = 'default',
}) => {
  const baseClasses = 'rounded-xl'

  const defaultClasses = 'bg-surface-card border border-border ob-ring-glow'
  const technicalClasses = 'bg-surface-card border border-border'
  const flatClasses = 'bg-surface-sunken rounded-xl border border-border'
  const solidClasses = 'bg-surface-card'

  let variantClasses = defaultClasses
  if (variant === 'technical') variantClasses = technicalClasses
  if (variant === 'flat') variantClasses = flatClasses
  if (variant === 'solid') variantClasses = solidClasses

  return (
    <div
      onClick={onClick}
      className={`
        ${baseClasses}
        ${variantClasses}
        ${onClick ? 'cursor-pointer ob-press-spring' : ''}
        ${className}
      `}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          {title && (
            <h3 className="font-medium text-txt-primary text-sm tracking-tight">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  )
}
