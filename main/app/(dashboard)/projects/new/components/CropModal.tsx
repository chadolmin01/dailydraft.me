'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { Area } from 'react-easy-crop'
import { Crop, Check, Loader2 } from 'lucide-react'
import { useBackHandler } from '@/src/hooks/useBackHandler'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Cropper = dynamic(() => import('react-easy-crop').then(m => m.default), { ssr: false }) as any

interface CropModalProps {
  cropSrc: string
  crop: { x: number; y: number }
  zoom: number
  cropQueueLength: number
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (_: Area, pixels: Area) => void
  onCropConfirm: () => void
  onCropCancel: () => void
}

export function CropModal({ cropSrc, crop, zoom, cropQueueLength, onCropChange, onZoomChange, onCropComplete, onCropConfirm, onCropCancel }: CropModalProps) {
  useBackHandler(true, onCropCancel, 'crop-modal')

  // blob URL → data URL 변환 (모바일 Safari에서 blob URL이 불안정)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [debug, setDebug] = useState('loading...')
  useEffect(() => {
    setDataUrl(null)
    setDebug('converting...')

    // blob URL을 fetch → base64 data URL로 변환
    const convert = async () => {
      try {
        const res = await fetch(cropSrc)
        const blob = await res.blob()
        setDebug(`blob: ${blob.type}, ${(blob.size / 1024).toFixed(0)}KB`)
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          setDebug(`dataUrl ready (${(result.length / 1024).toFixed(0)}KB)`)
          setDataUrl(result)
        }
        reader.onerror = () => {
          setDebug('FileReader error')
          setDataUrl(cropSrc) // fallback to blob URL
        }
        reader.readAsDataURL(blob)
      } catch (err) {
        setDebug(`fetch error: ${err}`)
        setDataUrl(cropSrc) // fallback to blob URL
      }
    }
    convert()
  }, [cropSrc])

  // 모달이 열릴 때 body 스크롤 잠금 (모바일 터치 이벤트 충돌 방지)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      style={{ touchAction: 'none' }}
    >
      <div className="bg-surface-card rounded-xl border border-border-subtle w-full max-w-lg flex flex-col overflow-hidden shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Crop size={13} className="text-txt-tertiary" />
            <span className="text-[10px] font-medium text-txt-secondary">이미지 크롭</span>
            <span className="text-[10px] font-mono text-txt-disabled">16:9</span>
          </div>
          {cropQueueLength > 0 && (
            <span className="text-[10px] font-mono text-txt-disabled">
              +{cropQueueLength}장 대기
            </span>
          )}
        </div>

        {/* Crop area */}
        <div className="relative w-full h-72 sm:h-80 bg-black" style={{ touchAction: 'none' }}>
          {/* 임시 디버그 — 문제 해결 후 제거 */}
          <div className="absolute top-1 left-1 z-10 text-[9px] text-yellow-400 bg-black/70 px-1.5 py-0.5 rounded font-mono pointer-events-none">
            {debug}
          </div>
          {dataUrl ? (
            <Cropper
              image={dataUrl}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
              showGrid
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-white/50" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 py-3 space-y-3 bg-surface-card">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-txt-disabled w-6">줌</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={e => onZoomChange(Number(e.target.value))}
              className="flex-1 h-1 accent-black"
            />
            <span className="text-[10px] font-mono text-txt-tertiary w-8 text-right">{zoom.toFixed(1)}x</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCropCancel}
              className="flex-1 py-2.5 text-xs font-medium border border-border rounded-lg text-txt-secondary hover:bg-surface-sunken transition-colors"
            >
              건너뛰기
            </button>
            <button
              type="button"
              onClick={onCropConfirm}
              className="flex-1 py-2.5 text-xs font-medium bg-surface-inverse text-txt-inverse border border-surface-inverse rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
            >
              <Check size={13} />
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
