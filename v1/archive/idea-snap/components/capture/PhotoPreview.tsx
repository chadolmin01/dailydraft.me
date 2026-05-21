'use client'

import { useState } from 'react'
import { X, RotateCcw, Check, MapPin, Loader2 } from 'lucide-react'
import type { GeolocationData } from '@/lib/hooks'

interface PhotoPreviewProps {
  photoData: string
  location: GeolocationData | null
  onSubmit: (caption?: string) => Promise<void>
  onRetake: () => void
  onClose: () => void
  isSubmitting: boolean
}

export function PhotoPreview({
  photoData,
  location,
  onSubmit,
  onRetake,
  onClose,
  isSubmitting,
}: PhotoPreviewProps) {
  const [caption, setCaption] = useState('')

  const handleSubmit = () => {
    onSubmit(caption.trim() || undefined)
  }

  return (
    <div className="camera-view bg-black flex flex-col">
      {/* Preview image */}
      <div className="flex-1 relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoData}
          alt="Preview"
          className="w-full h-full object-contain"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-3 rounded-full bg-black/50 safe-area-top tap-target"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Bottom controls */}
      <div className="bg-zinc-900 safe-area-bottom">
        {/* Caption input */}
        <div className="px-4 py-4">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="캡션 추가 (선택)"
            className="w-full px-4 py-3 bg-zinc-800 rounded-xl text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-violet-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Location indicator */}
        {location && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <MapPin className="w-4 h-4" />
              <span>
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={onRetake}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-800 text-white disabled:opacity-50 tap-target"
          >
            <RotateCcw className="w-5 h-5" />
            다시 찍기
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-violet-600 text-white font-medium disabled:opacity-50 tap-target"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
