'use client'

import React from 'react'
import { Plus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  /** compact = sidebar/small sections, default = full section */
  size?: 'compact' | 'default'
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  size = 'default',
  className = '',
}) => {
  const isCompact = size === 'compact'
  const hasAction = actionLabel && (actionHref || onAction)

  const ActionButton = () => {
    if (!hasAction) return null

    const buttonSize = isCompact ? 'sm' as const : 'md' as const

    if (actionHref) {
      return (
        <Link href={actionHref}>
          <Button variant="blue" size={buttonSize} className="rounded-full">
            <Plus size={isCompact ? 14 : 16} />
            {actionLabel}
          </Button>
        </Link>
      )
    }
    return (
      <Button variant="blue" size={buttonSize} onClick={onAction} className="rounded-full">
        <Plus size={isCompact ? 14 : 16} />
        {actionLabel}
      </Button>
    )
  }

  return (
    <div className={`
      rounded-xl text-center
      ${isCompact ? 'py-8 px-4' : 'py-16 px-8'}
      ${className}
    `}>
      {/* Icon — soft circle background with float animation */}
      <div className={`inline-flex items-center justify-center rounded-full bg-surface-sunken empty-float ${isCompact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'}`}>
        <Icon size={isCompact ? 22 : 28} className="text-txt-tertiary" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <p className={`font-semibold text-txt-primary ${isCompact ? 'text-sm mb-1' : 'text-base mb-1.5'}`}>
        {title}
      </p>

      {/* Description */}
      {description && (
        <p className={`text-txt-tertiary max-w-xs mx-auto ${isCompact ? 'text-xs mb-4' : 'text-sm mb-5'}`}>
          {description}
        </p>
      )}

      {/* CTA Button */}
      {!description && hasAction && <div className={isCompact ? 'mt-4' : 'mt-5'} />}
      <ActionButton />
    </div>
  )
}
