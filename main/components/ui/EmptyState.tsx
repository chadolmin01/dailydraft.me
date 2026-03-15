'use client'

import React from 'react'
import { Plus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

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

    const buttonContent = (
      <>
        <Plus size={isCompact ? 14 : 16} />
        <span>{actionLabel}</span>
      </>
    )

    const buttonClass = isCompact
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-txt-inverse rounded-lg hover:bg-accent-hover transition-colors'
      : 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-accent text-txt-inverse rounded-lg hover:bg-accent-hover transition-colors shadow-sm'

    if (actionHref) {
      return <Link href={actionHref} className={buttonClass}>{buttonContent}</Link>
    }
    return <button onClick={onAction} className={buttonClass}>{buttonContent}</button>
  }

  return (
    <div className={`
      bg-surface-card border border-border rounded-xl text-center
      ${isCompact ? 'py-6 px-4' : 'py-12 px-6'}
      ${className}
    `}>
      {/* Icon with + badge */}
      <div className={`relative inline-flex items-center justify-center ${isCompact ? 'mb-2' : 'mb-4'}`}>
        <div className={`
          rounded-2xl bg-surface-sunken flex items-center justify-center
          ${isCompact ? 'w-10 h-10' : 'w-14 h-14'}
        `}>
          <Icon size={isCompact ? 20 : 24} className="text-txt-disabled" />
        </div>
        {hasAction && (
          <div className={`
            absolute -top-1 -right-1 bg-accent text-txt-inverse rounded-full flex items-center justify-center
            ${isCompact ? 'w-4 h-4' : 'w-5 h-5'}
          `}>
            <Plus size={isCompact ? 10 : 12} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Title */}
      <p className={`font-medium text-txt-secondary ${isCompact ? 'text-xs mb-1' : 'text-sm mb-1.5'}`}>
        {title}
      </p>

      {/* Description */}
      {description && (
        <p className={`text-txt-disabled ${isCompact ? 'text-xs mb-3' : 'text-xs mb-4'}`}>
          {description}
        </p>
      )}

      {/* CTA Button */}
      {!description && hasAction && <div className={isCompact ? 'mt-3' : 'mt-4'} />}
      <ActionButton />
    </div>
  )
}
