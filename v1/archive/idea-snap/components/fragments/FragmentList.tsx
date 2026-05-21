'use client'

import { Fragment } from '@/types/database'
import { FragmentCard } from './FragmentCard'
import { Camera } from 'lucide-react'

interface FragmentListProps {
  fragments: Fragment[]
  isLoading: boolean
  onDelete: (id: string) => void
  onArchive: (id: string) => void
}

export function FragmentList({
  fragments,
  isLoading,
  onDelete,
  onArchive,
}: FragmentListProps) {
  if (isLoading) {
    return (
      <div className="px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-zinc-900 rounded-2xl h-48 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (fragments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
          <Camera className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          아직 사진이 없습니다
        </h3>
        <p className="text-zinc-500 text-sm">
          카메라로 순간을 캡처해보세요
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {fragments.map((fragment) => (
        <FragmentCard
          key={fragment.id}
          fragment={fragment}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      ))}
    </div>
  )
}
