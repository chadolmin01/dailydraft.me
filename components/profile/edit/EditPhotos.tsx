'use client'

import React from 'react'
import Image from 'next/image'
import { Camera, ImageIcon, Loader2 } from 'lucide-react'
import type { EditPhotosProps } from './types'

export const EditPhotos: React.FC<EditPhotosProps> = ({
  profile,
  avatarInputRef,
  coverInputRef,
  uploadingAvatar,
  uploadingCover,
  handleFileSelect,
}) => {
  return (
    <section>
      <h3 className="text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest mb-4 flex items-center gap-2">
        <Camera size={14} /> 사진
      </h3>

      {/* 커버 사진 */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-txt-secondary mb-1.5">커버 사진</label>
        <button
          onClick={() => coverInputRef.current?.click()}
          className="relative group w-full h-28 border border-border overflow-hidden"
        >
          {profile?.cover_image_url ? (
            <Image src={profile.cover_image_url} alt="cover" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface-sunken to-border flex items-center justify-center">
              <ImageIcon size={20} className="text-txt-tertiary" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={12} /> 변경
            </span>
          </div>
          {uploadingCover && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
        </button>
      </div>

      {/* 프로필 사진 */}
      <div>
        <label className="block text-xs font-medium text-txt-secondary mb-1.5">프로필 사진</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="relative group w-20 h-20 border border-border overflow-hidden flex-shrink-0"
          >
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-sunken flex items-center justify-center text-xl font-bold text-txt-tertiary">
                {profile?.nickname?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <Camera size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-white" />
              </div>
            )}
          </button>
          <div className="text-xs text-txt-tertiary">
            <p>클릭하여 사진을 변경하세요</p>
            <p className="text-txt-tertiary mt-0.5">최대 5MB, JPG/PNG</p>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file, 'avatar')
          e.target.value = ''
        }}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file, 'cover')
          e.target.value = ''
        }}
      />
    </section>
  )
}
