'use client'

import { useState } from 'react'
import { X, Check, MapPin, Loader2 } from 'lucide-react'
import { useGeolocation, type GeolocationData } from '@/lib/hooks'

interface MemoInputProps {
  onSubmit: (data: {
    content: string
    location: GeolocationData | null
  }) => Promise<void>
  onClose: () => void
}

export function MemoInput({ onSubmit, onClose }: MemoInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [includeLocation, setIncludeLocation] = useState(false)

  const { location, getCurrentLocation, isLoading: locationLoading } = useGeolocation()

  const handleToggleLocation = async () => {
    if (!includeLocation && !location) {
      await getCurrentLocation()
    }
    setIncludeLocation(!includeLocation)
  }

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        content: content.trim(),
        location: includeLocation ? location : null,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save memo:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 safe-area-top">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="p-2 rounded-full tap-target"
        >
          <X className="w-6 h-6 text-zinc-400" />
        </button>

        <h1 className="text-lg font-semibold text-white">메모</h1>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-violet-600 text-white font-medium disabled:opacity-50 tap-target"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          저장
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="아이디어, 기술, 해결책을 기록하세요..."
          className="w-full h-full bg-transparent text-white text-lg placeholder-zinc-500 outline-none resize-none"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="px-4 py-4 border-t border-zinc-800 safe-area-bottom">
        <button
          onClick={handleToggleLocation}
          disabled={locationLoading || isSubmitting}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors tap-target ${
            includeLocation
              ? 'bg-violet-600/20 text-violet-400'
              : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {locationLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          <span className="text-sm">
            {includeLocation ? '위치 포함됨' : '위치 추가'}
          </span>
        </button>

        {includeLocation && location && (
          <p className="mt-2 text-xs text-zinc-500">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  )
}
