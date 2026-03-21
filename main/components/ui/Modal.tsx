'use client'

import React, { useEffect, useCallback } from 'react'
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
 *
 * Usage:
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="Details" size="lg">
 *     {existing modal content — no changes needed}
 *   </Modal>
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
  useScrollLock(isOpen)
  useBackHandler(isOpen, onClose)
  const containerRef = useFocusTrap<HTMLDivElement>(isOpen)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-modal-backdrop flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-inverse/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={containerRef}
        tabIndex={-1}
        className={cn(
          'relative z-modal bg-surface-elevated w-full shadow-brutal border border-border-strong',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && (
              <h2 className="font-bold text-txt-primary text-base">
                {title}
              </h2>
            )}
            {!title && <div />}
            {showClose && (
              <button
                onClick={onClose}
                aria-label="닫기"
                className="p-1 hover:bg-surface-sunken transition-colors text-txt-tertiary hover:text-txt-secondary border border-transparent hover:border-border"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
