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
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand text-white border border-brand hover:bg-brand-hover transition-colors hover:opacity-90 active:scale-[0.97]'
      : 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-brand text-white border border-brand hover:bg-brand-hover transition-colors hover:opacity-90 active:scale-[0.97]'

    if (actionHref) {
      return <Link href={actionHref} className={buttonClass}>{buttonContent}</Link>
    }
    return <button onClick={onAction} className={buttonClass}>{buttonContent}</button>
  }

  return (
    <div className={`
      bg-surface-card border border-dashed border-border text-center
      ${isCompact ? 'py-6 px-4' : 'py-12 px-6'}
      ${className}
    `}>
      {/* Icon with + badge */}
      <div className={`relative inline-flex items-center justify-center ${isCompact ? 'mb-2' : 'mb-4'}`}>
        <div className={`
          bg-surface-sunken border border-dashed border-border flex items-center justify-center animate-pulse
          ${isCompact ? 'w-10 h-10' : 'w-16 h-16'}
        `}>
          <Icon size={isCompact ? 20 : 28} className="text-txt-disabled" />
        </div>
        {hasAction && (
          <div className={`
            absolute -top-1 -right-1 bg-brand text-white flex items-center justify-center
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
