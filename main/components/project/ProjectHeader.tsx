import React from 'react'
import Image from 'next/image'
import {
  Calendar, MapPin, Eye, Heart,
} from 'lucide-react'
import { Badges } from '@/components/ui/Badge'
import { ProjectHeaderProps } from './types'
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

  return (
    <>
      {/* Title-first section */}
      <div className="px-5 sm:px-8 pt-6 pb-4 space-y-3">
        <h2 className="text-[22px] sm:text-[26px] font-bold text-txt-primary break-keep leading-tight">
          {opportunity.title}
          <Badges badges={(opportunity as unknown as { badges?: string[] | null }).badges ?? null} className="ml-2 inline-flex align-middle" />
          {!isOwner && matchScore != null && matchScore >= 60 && (
            <span className={`ml-2 text-[13px] font-semibold px-2 py-0.5 rounded-full align-middle ${
              matchScore >= 80
                ? 'bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759]'
                : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-tertiary'
            }`}>
              {matchScore >= 80 ? '잘 맞는 프로젝트' : '관심 가능'}
            </span>
          )}
        </h2>

        {/* Creator + date */}
        <div className="flex items-center gap-3">
          {creator ? (
            <span className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#3182F6] rounded-full flex items-center justify-center text-[12px] font-bold text-white">
                {creator.nickname.charAt(0)}
              </div>
              <span className="text-[15px] font-medium text-txt-primary">{creator.nickname}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-full flex items-center justify-center text-[12px] font-bold text-txt-disabled">?</div>
              <span className="text-[15px] font-medium text-txt-primary">익명</span>
            </span>
          )}
          {opportunity.created_at && (
            <span className="flex items-center gap-1.5 text-[13px] text-txt-tertiary">
              <Calendar size={13} />
              {daysAgo === 0 ? '오늘' : `${daysAgo}일 전`}
            </span>
          )}
          {opportunity.location_type && (
            <span className="flex items-center gap-1.5 text-[13px] text-txt-tertiary">
              <MapPin size={13} />
              {opportunity.location_type === 'remote' ? '원격' :
               opportunity.location_type === 'offline' ? '오프라인' : '혼합'}
            </span>
          )}
        </div>

        {/* Tags pills */}
        {opportunity.interest_tags && opportunity.interest_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {opportunity.interest_tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-[13px] font-medium bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Views + interests */}
        <div className="flex items-center gap-4 text-[13px] text-txt-tertiary">
          <span className="flex items-center gap-1">
            <Eye size={13} />
            조회 {opportunity.views_count ?? 0}
          </span>
          {handleInterest ? (
            <button
              onClick={handleInterest}
              disabled={interestLoading}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[14px] font-medium transition-colors active:scale-[0.96] ${
                hasInterested
                  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-500'
                  : 'border-border hover:bg-rose-50 dark:hover:bg-rose-500/5 text-txt-tertiary hover:text-rose-500 hover:border-rose-200'
              }`}
            >
              <Heart size={15} className={hasInterested ? 'fill-rose-400 text-rose-400' : ''} />
              관심 {(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}
            </button>
          ) : (
            <span className="flex items-center gap-1">
              <Heart size={13} className={hasInterested ? 'fill-rose-400 text-rose-400' : ''} />
              관심 {(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}
            </span>
          )}
        </div>
      </div>

      {/* Image frame — 고정 영역, 이미지 유무에 따라 내용만 변경 */}
      <div className="px-5 sm:px-8 pb-4">
        <div className="bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-2xl overflow-hidden h-[160px] sm:h-[200px]">
          {hasImages ? (
            <div className="flex gap-2 h-full overflow-x-auto snap-x snap-mandatory px-3 py-3 scrollbar-hide">
              {opportunity.demo_images!.map((src, idx) => (
                <div key={idx} className="relative h-full aspect-[4/3] shrink-0 rounded-xl overflow-hidden snap-center">
                  <Image
                    src={src}
                    alt={`${opportunity.title} ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    sizes="(max-width:768px) 60vw, 300px"
                    className="object-cover"
                    quality={85}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <Image
                src={getCategoryCover(opportunity.interest_tags || [])}
                alt="카테고리"
                width={48}
                height={48}
                className="opacity-30"
              />
              <span className="text-[13px] text-txt-disabled">아직 등록된 이미지가 없어요</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
