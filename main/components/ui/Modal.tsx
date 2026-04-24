'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { useScrollLock } from '@/src/hooks/useScrollLock'
import { useFocusTrap } from '@/src/hooks/useFocusTrap'
import { useBackHandler } from '@/src/hooks/useBackHandler'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** Max width of the modal panel */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Show the X close button */
  showClose?: boolean
  /** Modal title (optional, renders a header bar) */
  title?: string
  /** Additional className for the panel */
  className?: string
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] md:max-w-[calc(100vw-4rem)]',
} as const

/**
 * Base modal shell with backdrop, scroll lock, focus trap, ESC close, and ARIA.
 * Rendered via createPortal to document.body — escapes transformed ancestor stacking contexts.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  showClose = true,
  title,
  className,
}) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useScrollLock(isOpen)
  useBackHandler(isOpen, onClose)
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen)

  if (!mounted) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-popover flex items-end sm:items-center justify-center p-0 pt-6 sm:p-4',
        'transition-opacity duration-200',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-inverse/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={containerRef}
        tabIndex={-1}
        className={cn(
          'relative z-501 bg-surface-elevated w-full shadow-2xl rounded-2xl sm:rounded-2xl',
          'pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] sm:pb-0',
          'transition-all duration-200',
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2',
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4">
            {title && (
              <h2 className="font-bold text-txt-primary text-[17px]">
                {title}
              </h2>
            )}
            {!title && <div />}
            {showClose && (
              <button
                onClick={onClose}
                aria-label="닫기"
                className="p-1.5 bg-surface-sunken hover:bg-border transition-colors text-txt-tertiary rounded-full"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>,
    document.body
  )
}
