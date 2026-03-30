'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: string
  title?: string
  action?: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'sketch' | 'technical' | 'flat' | 'solid'
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
  // Base classes — brutalist
  const baseClasses = 'transition-all duration-200'

  // Default: Hard border, sharp shadow
  const defaultClasses = 'bg-surface-card border border-border-strong hover:shadow-sharp'

  // Technical: Dashed border, blueprint feel
  const technicalClasses =
    'bg-surface-card border border-dashed border-border hover:border-border-strong'

  // Flat: Minimal but angular
  const flatClasses = 'bg-surface-sunken border border-border'

  // Solid: For vivid custom backgrounds (no default border/bg)
  const solidClasses = ''

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
        ${onClick ? 'cursor-pointer active:scale-[0.985] active:shadow-none' : ''}
        ${className}
      `}
    >
      {(title || action) && (
        <div className={`px-6 py-4 border-b border-dashed border-border flex justify-between items-center`}>
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
