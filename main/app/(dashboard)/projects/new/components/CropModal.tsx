'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { Area } from 'react-easy-crop'
import { Crop, Check } from 'lucide-react'

const Cropper = dynamic(() => import('react-easy-crop').then(m => m.default), { ssr: false }) as unknown as React.ComponentType<Partial<import('react-easy-crop').CropperProps>>

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
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
        <div className="relative w-full h-72 sm:h-80 bg-black">
          <Cropper
            image={cropSrc}
            crop={crop}
            zoom={zoom}
            aspect={16 / 9}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            showGrid
          />
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
