'use client'

import React, { useState, useCallback } from 'react'
import { Plus, X, Star, ImagePlus, Upload } from 'lucide-react'

interface ImageUploadSectionProps {
  imagePreviews: string[]
  imageFilesLength: number
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (idx: number) => void
  onSetAsMain: (idx: number) => void
  onDropFiles?: (files: File[]) => void
}

export function ImageUploadSection({ imagePreviews, imageFilesLength, onImageSelect, onRemoveImage, onSetAsMain, onDropFiles }: ImageUploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (!onDropFiles) return
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) onDropFiles(files)
  }, [onDropFiles])

  if (imagePreviews.length > 0) {
    return (
      <div
        className="space-y-1.5"
        onDragOver={onDropFiles ? handleDragOver : undefined}
        onDragLeave={onDropFiles ? handleDragLeave : undefined}
        onDrop={onDropFiles ? handleDrop : undefined}
      >
        {/* Main image */}
        <div
          className={`relative group overflow-hidden border rounded-xl transition-colors ${
            isDragOver ? 'border-brand border-2' : 'border-border-subtle'
          }`}
        >
          <img
            src={imagePreviews[0]}
            alt="메인 이미지"
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {isDragOver && (
            <div className="absolute inset-0 bg-brand/10 flex items-center justify-center animate-fade-in">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg shadow-sm">
                <Upload size={14} className="text-brand" />
                <span className="text-xs font-medium text-brand">여기에 놓으세요</span>
              </div>
            </div>
          )}
          {imagePreviews.length > 1 && !isDragOver && (
            <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/80 text-white text-[10px] font-medium">
              <Star size={9} className="fill-white" />
              메인
            </span>
          )}
          {!isDragOver && (
            <button
              type="button"
              onClick={() => onRemoveImage(0)}
              className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
            >
              <X size={14} className="text-white" />
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {(imagePreviews.length > 1 || imageFilesLength < 5) && (
          <div className="flex gap-1.5">
            {imagePreviews.slice(1).map((src, i) => {
              const idx = i + 1
              return (
                <div
                  key={src}
                  className="relative group flex-1 min-w-0 border border-border-subtle rounded-lg overflow-hidden animate-badge-pop"
                >
                  <img
                    src={src}
                    alt={`이미지 ${idx + 1}`}
                    className="w-full h-[4.5rem] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onSetAsMain(idx)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1 text-white text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star size={9} />
                      메인으로
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  >
                    <X size={11} className="text-white" />
                  </button>
                </div>
              )
            })}
            {imageFilesLength < 5 && (
              <label className="flex-1 min-w-0 flex items-center justify-center border border-dashed border-border-subtle rounded-lg cursor-pointer hover:border-brand/30 hover:bg-surface-sunken transition-colors h-[4.5rem]">
                <div className="text-center">
                  <Plus size={14} className="text-txt-disabled mx-auto mb-0.5" />
                  <span className="text-[10px] text-txt-disabled">추가</span>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={onImageSelect} className="hidden" />
              </label>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <label
      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all h-40 group active:scale-[0.98] ${
        isDragOver
          ? 'border-brand bg-brand/5 scale-[1.01]'
          : 'border-border-subtle hover:border-brand/30 hover:bg-surface-sunken'
      }`}
      onDragOver={onDropFiles ? handleDragOver : undefined}
      onDragLeave={onDropFiles ? handleDragLeave : undefined}
      onDrop={onDropFiles ? handleDrop : undefined}
    >
      <div
        className={`w-10 h-10 bg-surface-sunken rounded-xl flex items-center justify-center mb-3 group-hover:bg-accent-secondary transition-all ${
          isDragOver ? 'scale-110 -translate-y-1' : ''
        }`}
      >
        {isDragOver ? (
          <Upload size={18} className="text-brand transition-colors" />
        ) : (
          <ImagePlus size={18} className="text-txt-disabled group-hover:text-txt-tertiary transition-colors" />
        )}
      </div>
      <p className="text-sm text-txt-tertiary font-medium">
        {isDragOver ? '여기에 놓으세요' : '프로젝트 이미지 추가'}
      </p>
      <p className="text-[10px] text-txt-disabled mt-1">
        {isDragOver ? '드래그 앤 드롭으로 업로드' : 'JPG, PNG, WebP, GIF / 최대 5장'}
      </p>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={onImageSelect} className="hidden" />
    </label>
  )
}
