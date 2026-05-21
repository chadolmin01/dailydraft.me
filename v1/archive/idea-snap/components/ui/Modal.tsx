'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-t-3xl animate-slide-up safe-area-bottom">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-zinc-600" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors tap-target"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  )
}
