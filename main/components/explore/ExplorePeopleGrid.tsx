'use client'

import React, { useRef, useEffect } from 'react'
import Image from 'next/image'
import { Users, Coffee } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { getMatchColorClass } from './constants'
import { AFFILIATION_LABELS } from '@/components/profile-modal/types'
import { Badges } from '@/components/ui/Badge'
import { staggerOnceClass } from '@/src/hooks/useStaggerOnce'
import type { TalentCard, PeopleSortBy } from './types'

interface ExplorePeopleGridProps {
  talentCards: TalentCard[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hasMore: boolean
  isFetchingMore: boolean
  onLoadMore: () => void
  onSelectProfile: (id: string, byUserId: boolean) => void
  peopleSortBy: PeopleSortBy
}

/**
 * 아바타 배경색 — 이름 해시 기반으로 일관된 색상 부여.
 * 하드코딩 색상이 아닌 디자인 토큰 기반 brand-bg를 기본으로 쓰되,
 * 아바타 이미지가 없을 때 시각적 구분을 위해 사용.
 */
const AVATAR_COLORS = [
  'bg-brand-bg text-brand',
  'bg-status-success-bg text-status-success-text',
  'bg-surface-sunken text-txt-secondary',
] as const

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * 상태 텍스트와 스타일 매핑.
 * wireframe 기준: "팀 찾는 중" = brand, "참여 중" = success
 */
function getStatusConfig(status: string): { label: string; className: string } | null {
  switch (status) {
    case 'OPEN':
      return { label: '팀 찾는 중', className: 'text-brand bg-brand-bg' }
    case 'BUSY':
      return { label: '참여 중', className: 'text-status-success-text bg-status-success-bg' }
    default:
      return null
  }
}

function PersonCard({
  t,
  index,
  peopleSortBy,
  onSelectProfile,
  staggerKey,
}: {
  t: TalentCard
  index: number
  peopleSortBy: PeopleSortBy
  onSelectProfile: (id: string, byUserId: boolean) => void
  staggerKey: string
}) {
  const stagger = staggerOnceClass(staggerKey)
  const statusConfig = getStatusConfig(t.status)
  const bio = peopleSortBy === 'ai' && t.matchReason ? t.matchReason : t.visionSummary

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelectProfile(t.id, false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelectProfile(t.id, false)
        }
      }}
      style={stagger ? { animationDelay: `${Math.min(index * 50, 500)}ms` } : undefined}
      className={`${stagger} bg-surface-card border border-border rounded-2xl shadow-sm cursor-pointer
        flex flex-col items-center text-center
        px-5 py-6 gap-2.5
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
        focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none
        active:scale-[0.985] active:shadow-none`}
    >
      {/* Avatar: 48x48 circle */}
      <div
        className={`relative w-12 h-12 rounded-full flex items-center justify-center
          text-base font-bold shrink-0 overflow-hidden border border-border/50
          ${getAvatarColor(t.name)}`}
      >
        {t.name.substring(0, 2)}
        {t.avatarUrl && (
          <Image
            src={t.avatarUrl}
            alt={t.name}
            width={48}
            height={48}
            className="absolute inset-0 w-full h-full object-cover"
            quality={85}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>

      {/* Name: 15px bold */}
      <div className="flex items-center gap-1.5">
        <h3 className="font-bold text-[15px] leading-tight text-txt-primary truncate max-w-[160px]">
          {t.name}
        </h3>
        <Badges badges={t.badges} />
        {peopleSortBy === 'ai' && t.matchScore != null && t.matchScore > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getMatchColorClass(t.matchScore)}`}>
            {t.matchScore}%
          </span>
        )}
      </div>

      {/* University: 13px secondary */}
      {t.university && (
        <p className="text-[13px] text-txt-secondary leading-tight truncate max-w-full -mt-1">
          {t.university}
          {t.affiliationType && AFFILIATION_LABELS[t.affiliationType]
            ? ` \u00B7 ${AFFILIATION_LABELS[t.affiliationType]}`
            : ''}
        </p>
      )}

      {/* Role badge: inline pill */}
      {t.role && (
        <span className="bg-surface-sunken text-txt-secondary px-2.5 py-0.5 rounded-full font-semibold text-xs">
          {t.role}
        </span>
      )}

      {/* Tags: brand pills, centered wrap */}
      {t.tags.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {t.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="text-brand bg-brand-bg text-[11px] font-medium px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {t.tags.length > 4 && (
            <span className="text-[11px] text-txt-tertiary">+{t.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Bio: 13px tertiary, 1-line clamp */}
      {bio && (
        <p className="text-[13px] text-txt-tertiary leading-snug line-clamp-1 w-full">
          {bio}
        </p>
      )}

      {/* Bottom row: status badge + club chip */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap mt-0.5">
        {statusConfig && (
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        )}
        {t.status === 'OPEN' && (
          <span className="text-brand" title="커피챗 가능">
            <Coffee size={13} />
          </span>
        )}
      </div>
    </div>
  )
}

export function ExplorePeopleGrid({
  talentCards,
  isLoading,
  isError,
  onRetry,
  hasMore,
  isFetchingMore,
  onLoadMore,
  onSelectProfile,
  peopleSortBy,
}: ExplorePeopleGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  return (
    <section>
      {isError ? (
        <ErrorState message="프로필을 불러오는 데 실패했습니다" onRetry={onRetry} />
      ) : isLoading ? (
        <SkeletonGrid count={6} cols={2} />
      ) : talentCards.length === 0 ? (
        <EmptyState
          icon={Users}
          title="등록된 사람이 없습니다"
          description="프로필을 공개하면 여기에 표시됩니다"
        />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {talentCards.map((t, index) => (
            <PersonCard
              key={t.id}
              t={t}
              index={index}
              peopleSortBy={peopleSortBy}
              onSelectProfile={onSelectProfile}
              staggerKey={`talent:${t.id}`}
            />
          ))}
        </div>
      )}

      {talentCards.length > 0 && hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isFetchingMore && (
            <span className="text-xs text-txt-tertiary animate-pulse">로딩 중...</span>
          )}
        </div>
      )}
    </section>
  )
}
