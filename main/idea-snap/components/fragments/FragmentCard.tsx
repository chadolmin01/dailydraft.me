'use client'

import { useState } from 'react'
import { Camera, FileText, MapPin, Trash2, Archive, MoreVertical } from 'lucide-react'
import type { Fragment } from '@/types/database'

interface FragmentCardProps {
  fragment: Fragment
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

export function FragmentCard({ fragment, onDelete, onArchive }: FragmentCardProps) {
  const [showActions, setShowActions] = useState(false)

  const isPhoto = fragment.type === 'photo'
  const timeAgo = getTimeAgo(new Date(fragment.captured_at))

  return (
    <div className="relative bg-zinc-900 rounded-2xl overflow-hidden">
      {/* Photo content */}
      {isPhoto && fragment.photo_url && (
        <div className="aspect-square relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fragment.photo_url}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Caption overlay */}
          {fragment.content && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-sm text-white line-clamp-2">{fragment.content}</p>
            </div>
          )}
        </div>
      )}

      {/* Memo content */}
      {!isPhoto && (
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-white text-sm flex-1 line-clamp-4">
              {fragment.content}
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Type icon */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isPhoto ? 'bg-violet-500/20' : 'bg-amber-500/20'
            }`}
          >
            {isPhoto ? (
              <Camera className="w-3 h-3 text-violet-400" />
            ) : (
              <FileText className="w-3 h-3 text-amber-400" />
            )}
          </div>

          {/* Time */}
          <span className="text-xs text-zinc-500">{timeAgo}</span>

          {/* Location */}
          {fragment.location && (
            <div className="flex items-center gap-1 text-zinc-500">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">위치</span>
            </div>
          )}
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors tap-target"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 bottom-full mb-2 z-20 bg-zinc-800 rounded-xl overflow-hidden shadow-xl min-w-[140px]">
                <button
                  onClick={() => {
                    onArchive(fragment.id)
                    setShowActions(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-zinc-700 transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  보관하기
                </button>
                <button
                  onClick={() => {
                    onDelete(fragment.id)
                    setShowActions(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제하기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}
