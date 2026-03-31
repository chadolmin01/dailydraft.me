import React from 'react'
import { Plus, X, Star, ImagePlus } from 'lucide-react'

interface ImageUploadSectionProps {
  imagePreviews: string[]
  imageFilesLength: number
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: (idx: number) => void
  onSetAsMain: (idx: number) => void
}

export function ImageUploadSection({ imagePreviews, imageFilesLength, onImageSelect, onRemoveImage, onSetAsMain }: ImageUploadSectionProps) {
  if (imagePreviews.length > 0) {
    return (
      <div className="space-y-1.5">
        {/* Main image */}
        <div className="relative group overflow-hidden border border-border">
          <img
            src={imagePreviews[0]}
            alt="메인 이미지"
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {imagePreviews.length > 1 && (
            <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/80 text-white text-[0.625rem] font-medium">
              <Star size={9} className="fill-white" />
              메인
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemoveImage(0)}
            className="absolute top-3 right-3 w-7 h-7 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        {/* Thumbnails */}
        {(imagePreviews.length > 1 || imageFilesLength < 5) && (
          <div className="flex gap-1.5">
            {imagePreviews.slice(1).map((src, i) => {
              const idx = i + 1
              return (
                <div key={idx} className="relative group flex-1 min-w-0 border border-border overflow-hidden">
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
                    <span className="flex items-center gap-1 text-white text-[0.625rem] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star size={9} />
                      메인으로
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  >
                    <X size={11} className="text-white" />
                  </button>
                </div>
              )
            })}
            {imageFilesLength < 5 && (
              <label className="flex-1 min-w-0 flex items-center justify-center border border-border cursor-pointer hover:border-border hover:bg-surface-sunken transition-colors h-[4.5rem]">
                <div className="text-center">
                  <Plus size={14} className="text-txt-disabled mx-auto mb-0.5" />
                  <span className="text-[0.5625rem] text-txt-disabled">추가</span>
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
    <label className="flex flex-col items-center justify-center border border-border cursor-pointer hover:border-border hover:bg-surface-sunken/50 transition-all h-40 group">
      <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center mb-3 group-hover:bg-accent-secondary transition-colors">
        <ImagePlus size={18} className="text-txt-disabled group-hover:text-txt-tertiary transition-colors" />
      </div>
      <p className="text-sm text-txt-tertiary font-medium">프로젝트 이미지 추가</p>
      <p className="text-[0.625rem] text-txt-disabled mt-1">JPG, PNG, WebP, GIF / 최대 5장</p>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={onImageSelect} className="hidden" />
    </label>
  )
}
