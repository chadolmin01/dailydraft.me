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
      ? 'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-brand text-white rounded-full hover:bg-brand-hover active:scale-[0.97]'
      : 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-brand text-white rounded-full hover:bg-brand-hover active:scale-[0.97]'

    if (actionHref) {
      return <Link href={actionHref} className={buttonClass}>{buttonContent}</Link>
    }
    return <button onClick={onAction} className={buttonClass}>{buttonContent}</button>
  }

  return (
    <div className={`
      rounded-xl text-center
      ${isCompact ? 'py-8 px-4' : 'py-16 px-8'}
      ${className}
    `}>
      {/* Icon — soft circle background */}
      <div className={`inline-flex items-center justify-center rounded-full bg-surface-sunken ${isCompact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4'}`}>
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
