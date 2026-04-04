import React, { useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  Heart, Calendar, MapPin, Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badges } from '@/components/ui/Badge'
import { ProjectHeaderProps } from './types'
import { hapticMedium } from '@/src/utils/haptic'
import { CATEGORY_SLUGS } from '@/src/constants/categories'

function getCategoryCover(tags: string[]): string {
  const match = tags.find(t => CATEGORY_SLUGS.includes(t))
  return `/categories/${match ?? 'portfolio'}.svg`
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  opportunity,
  creator,
  isOwner,
  matchScore,
  daysAgo,
  hasInterested,
  interestLoading,
  handleInterest,
}) => {
  const hasImages = opportunity.demo_images && opportunity.demo_images.length > 0
  const coverSrc = hasImages
    ? opportunity.demo_images![0]
    : getCategoryCover(opportunity.interest_tags || [])

  return (
    <>
      {/* Hero Cover */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <Image
          src={coverSrc}
          alt={opportunity.title}
          fill
          priority
          sizes="(max-width:768px) 100vw, 768px"
          className="object-cover"
          quality={hasImages ? 90 : 85}
          onError={(e) => { e.currentTarget.src = getCategoryCover(opportunity.interest_tags || []) }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Tags overlay — top right */}
        {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1 max-w-[60%]">
            {opportunity.interest_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono bg-white/90 backdrop-blur-sm text-black px-2 py-0.5 border border-white/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom overlay — title/meta left, interest/views right */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-4 sm:pb-5 flex items-end justify-between gap-3">
          {/* Left: title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2 mb-2">
              <h2 className="text-xl sm:text-2xl font-black text-white break-keep leading-tight drop-shadow-sm">
                {opportunity.title}
              </h2>
              <Badges badges={(opportunity as unknown as { badges?: string[] | null }).badges ?? null} className="mt-1" />
              {!isOwner && matchScore != null && matchScore >= 60 && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border shrink-0 mt-1 ${
                  matchScore >= 80
                    ? 'bg-status-success-bg text-status-success-text border-indicator-online/20'
                    : 'bg-white/20 text-white/80 border-white/30'
                }`}>
                  {matchScore >= 80 ? '잘 맞는 프로젝트' : '관심 가능'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              {creator ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {creator.nickname.charAt(0)}
                  </div>
                  <span className="font-medium text-white/90">{creator.nickname}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-[10px] font-bold text-white/70">?</div>
                  <span className="font-medium text-white/90">익명</span>
                </span>
              )}
              {opportunity.created_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
                </span>
              )}
              {opportunity.location_type && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {opportunity.location_type === 'remote' ? '원격' :
                   opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
                </span>
              )}
            </div>
          </div>

          {/* Right: interest + views */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={() => {
                hapticMedium()
                if (isOwner) { toast('내 프로젝트에는 관심 표시를 할 수 없어요'); return }
                handleInterest()
              }}
              disabled={interestLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold rounded-full backdrop-blur-sm transition-all disabled:opacity-40 disabled:cursor-default ${
                hasInterested
                  ? 'bg-red-500/90 text-white border-red-400/60'
                  : 'bg-white/90 text-black border-white/60 hover:bg-white'
              }`}
            >
              <Heart size={11} className={hasInterested ? 'fill-current heart-burst' : ''} />
              {hasInterested ? '관심 표현됨' : '관심 있어요'}
              <span className="font-mono opacity-70">{(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}</span>
            </button>
            <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm text-white/70 text-[10px] font-mono rounded-full">
              <Eye size={10} />
              {opportunity.views_count ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Extra images gallery */}
      {hasImages && opportunity.demo_images!.length > 1 && (
        <div className="px-4 sm:px-8 pb-3">
          <div className="flex gap-2 overflow-x-auto">
            {opportunity.demo_images!.slice(1).map((src, idx) => (
              <div key={idx} className="relative h-24 w-32 shrink-0 border border-border">
                <Image
                  src={src}
                  alt={`${opportunity.title} 이미지 ${idx + 2}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                  quality={85}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
