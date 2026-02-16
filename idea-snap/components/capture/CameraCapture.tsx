'use client'

import { useState, useEffect } from 'react'
import { useCamera, useGeolocation, type GeolocationData } from '@/lib/hooks'
import { X, SwitchCamera, ImagePlus, MapPin } from 'lucide-react'
import { PhotoPreview } from './PhotoPreview'
import imageCompression from 'browser-image-compression'

interface CameraCaptureProps {
  onCapture: (data: {
    photoData: string
    location: GeolocationData | null
    caption?: string
  }) => Promise<void>
  onClose: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto } = useCamera({ facingMode })
  const { location, getCurrentLocation, isLoading: locationLoading } = useGeolocation()

  useEffect(() => {
    startCamera()
    getCurrentLocation()
    return () => stopCamera()
  }, [facingMode, startCamera, stopCamera, getCurrentLocation])

  const handleCapture = () => {
    const photo = capturePhoto()
    if (photo) {
      setCapturedPhoto(photo)
    }
  }

  const handleSwitchCamera = () => {
    stopCamera()
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setCapturedPhoto(result)
      }
      reader.readAsDataURL(compressed)
    } catch (err) {
      console.error('Failed to process image:', err)
    }
  }

  const handleSubmit = async (caption?: string) => {
    if (!capturedPhoto) return

    setIsSubmitting(true)
    try {
      await onCapture({
        photoData: capturedPhoto,
        location,
        caption,
      })
      onClose()
    } catch (err) {
      console.error('Failed to save photo:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetake = () => {
    setCapturedPhoto(null)
    startCamera()
  }

  // Show preview if photo captured
  if (capturedPhoto) {
    return (
      <PhotoPreview
        photoData={capturedPhoto}
        location={location}
        onSubmit={handleSubmit}
        onRetake={handleRetake}
        onClose={onClose}
        isSubmitting={isSubmitting}
      />
    )
  }

  return (
    <div className="camera-view bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-6">
            <p className="text-red-400 mb-4">{error}</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium cursor-pointer">
              <ImagePlus className="w-5 h-5" />
              갤러리에서 선택
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-black/50 tap-target"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Location indicator */}
          {location && (
            <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-black/50 text-sm text-white">
              <MapPin className="w-4 h-4" />
              <span className="text-xs">위치 저장됨</span>
            </div>
          )}
          {locationLoading && (
            <div className="px-3 py-2 rounded-full bg-black/50 text-xs text-zinc-400">
              위치 확인중...
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 safe-area-bottom">
        <div className="flex items-center justify-center gap-8 px-6 py-8">
          {/* Gallery button */}
          <label className="p-4 rounded-full bg-zinc-800/80 cursor-pointer tap-target">
            <ImagePlus className="w-6 h-6 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={!isActive}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border-4 border-black" />
          </button>

          {/* Switch camera button */}
          <button
            onClick={handleSwitchCamera}
            className="p-4 rounded-full bg-zinc-800/80 tap-target"
          >
            <SwitchCamera className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
