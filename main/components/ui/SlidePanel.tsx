'use client'

import React, { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface SlidePanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  /** Actions rendered in the header right side */
  headerActions?: React.ReactNode
  /** Panel width class, default w-[28rem] */
  width?: string
}

export const SlidePanel: React.FC<SlidePanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  headerActions,
  width = 'w-[28rem]',
}) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-modal-backdrop bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-modal h-full ${width} max-w-[calc(100vw-2rem)] bg-surface-bg border-l-2 border-border shadow-lg flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-card">
          <div>
            <h2 className="text-base font-bold text-txt-primary">{title}</h2>
            {subtitle && <p className="text-xs text-txt-tertiary mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-sunken transition-colors text-txt-tertiary hover:text-txt-primary border border-transparent hover:border-border"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
