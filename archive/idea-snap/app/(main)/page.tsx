'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, SwitchCamera, ImagePlus, MapPin, Send, Loader2 } from 'lucide-react'
import { useGeolocation } from '@/lib/hooks'
import imageCompression from 'browser-image-compression'

export default function CameraPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { location, getCurrentLocation } = useGeolocation()

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
    } catch {
      setError('카메라 접근 권한이 필요합니다')
      setIsActive(false)
    }
  }, [facingMode])

  // Stop camera
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsActive(false)
  }, [])

  // Initialize
  useEffect(() => {
    startCamera()
    getCurrentLocation()
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Restart on facing mode change
  useEffect(() => {
    if (capturedPhoto) return
    stopCamera()
    startCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  // Capture photo
  const handleCapture = () => {
    if (!videoRef.current || !isActive) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.9))
    stopCamera()
  }

  // File select
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
      reader.onload = (ev) => setCapturedPhoto(ev.target?.result as string)
      reader.readAsDataURL(compressed)
      stopCamera()
    } catch (err) {
      console.error(err)
    }
  }

  // Submit
  const handleSubmit = async () => {
    if (!capturedPhoto) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/fragments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'photo',
          content: caption.trim() || null,
          photoData: capturedPhoto,
          location,
        }),
      })
      if (res.ok) {
        setCapturedPhoto(null)
        setCaption('')
        startCamera()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Retake
  const handleRetake = () => {
    setCapturedPhoto(null)
    setCaption('')
    startCamera()
  }

  // ============ PREVIEW MODE ============
  if (capturedPhoto) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Photo */}
        <div className="flex-1 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capturedPhoto} alt="" className="w-full h-full object-cover" />

          {/* Retake button */}
          <button
            onClick={handleRetake}
            disabled={isSubmitting}
            className="absolute top-4 left-4 p-3 rounded-full bg-black/50 safe-area-top"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Location badge */}
          {location && (
            <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-2 rounded-full bg-black/50 safe-area-top">
              <MapPin className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Caption input - Instagram Story style */}
        <div className="absolute bottom-0 left-0 right-0 safe-area-bottom">
          <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-t from-black/80 to-transparent">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="한 줄 메모..."
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur rounded-full text-white placeholder-white/60 outline-none"
              disabled={isSubmitting}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ============ CAMERA MODE ============
  return (
    <div className="fixed inset-0 bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center px-6">
            <p className="text-white/60 mb-4">{error}</p>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full cursor-pointer">
              <ImagePlus className="w-5 h-5" />
              갤러리에서 선택
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 safe-area-top">
        <button
          onClick={() => router.push('/inbox')}
          className="px-4 py-2 rounded-full bg-black/50 text-white text-sm"
        >
          인박스
        </button>
        {location && (
          <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-black/50">
            <MapPin className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 safe-area-bottom">
        <div className="flex items-center justify-center gap-8 px-6 py-8">
          {/* Gallery */}
          <label className="p-4 rounded-full bg-white/20 cursor-pointer">
            <ImagePlus className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>

          {/* Shutter */}
          <button
            onClick={handleCapture}
            disabled={!isActive}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border-4 border-black" />
          </button>

          {/* Switch camera */}
          <button
            onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
            className="p-4 rounded-full bg-white/20"
          >
            <SwitchCamera className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
