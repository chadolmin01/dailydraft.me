'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { X, Camera } from 'lucide-react'
import type { CropModalProps } from './types'
import { useBackHandler } from '@/src/hooks/useBackHandler'

const Cropper = dynamic(() => import('react-easy-crop').then(m => m.default), { ssr: false }) as unknown as React.ComponentType<Partial<import('react-easy-crop').CropperProps>>

export const CropModal: React.FC<CropModalProps> = ({
  cropImage,
  setCropImage,
  cropType,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete,
  handleCropConfirm,
}) => {
  useBackHandler(!!cropImage, () => setCropImage(null), 'crop')
  if (!cropImage) return null

  return (
    <div className="fixed inset-0 z-popover flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-card border border-border-strong shadow-brutal-xl w-full max-w-lg mx-4 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-strong bg-surface-sunken">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-txt-tertiary">
            {cropType === 'avatar' ? 'CROP AVATAR' : 'CROP COVER'}
          </span>
          <button
            onClick={() => setCropImage(null)}
            className="p-1 hover:bg-surface-card transition-colors"
          >
            <X size={16} className="text-txt-disabled" />
          </button>
        </div>

        {/* 크롭 영역 */}
        <div className="relative w-full" style={{ height: cropType === 'avatar' ? 320 : 240 }}>
          <Cropper
            image={cropImage}
            crop={crop}
            zoom={zoom}
            aspect={cropType === 'avatar' ? 1 : 3}
            cropShape={cropType === 'avatar' ? 'round' : 'rect'}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* 줌 슬라이더 */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-[0.625rem] font-mono text-txt-tertiary">ZOOM</span>
            <input
              type="range"
              min={1} max={3} step={0.1}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 accent-brand cursor-pointer"
            />
            <span className="text-[0.625rem] font-mono text-txt-tertiary w-8 text-right">{zoom.toFixed(1)}x</span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-strong">
          <button
            onClick={() => setCropImage(null)}
            className="px-4 py-2 text-xs text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleCropConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-bold border border-brand hover:bg-brand-hover transition-all shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Camera size={12} /> 적용
          </button>
        </div>
      </div>
    </div>
  )
}
