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
  // Base classes - Removed bg-white to allow variants to control it
  const baseClasses = 'transition-all duration-200 rounded-xl'

  // Default: Clean white bg, border, subtle shadow, sharp hover
  const defaultClasses = 'bg-white border border-gray-200 hover:border-black hover:shadow-sm'

  // Sketch/Technical: Dashed or stricter lines
  const technicalClasses =
    'bg-gray-50/30 border border-dashed border-gray-300 hover:bg-white hover:border-gray-400'

  // Flat: Minimalist
  const flatClasses = 'bg-gray-50/50 border border-gray-100'

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
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {(title || action) && (
        <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center`}>
          {title && (
            <h3 className="font-sans font-bold text-gray-900 text-sm tracking-tight">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  )
}
