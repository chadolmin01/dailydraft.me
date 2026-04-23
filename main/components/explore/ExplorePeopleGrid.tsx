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
      className={`${stagger} ob-ring-glow ob-press-spring bg-surface-card rounded-xl cursor-pointer
        flex flex-col overflow-hidden border border-border
        focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 outline-none`}
    >
      {/* ── Header: 아바타 + 이름 + 역할 ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div
          className={`relative w-11 h-11 rounded-full flex items-center justify-center
            text-sm font-bold shrink-0 overflow-hidden
            ${getAvatarColor(t.name)}`}
        >
          {t.name.substring(0, 2)}
          {t.avatarUrl && (
            <Image
              src={t.avatarUrl}
              alt={t.name}
              width={44}
              height={44}
              className="absolute inset-0 w-full h-full object-cover"
              quality={85}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[15px] leading-tight text-txt-primary truncate">
              {t.name}
            </h3>
            <Badges badges={t.badges} />
            {peopleSortBy === 'ai' && t.matchScore != null && t.matchScore > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getMatchColorClass(t.matchScore)}`}>
                {t.matchScore}%
              </span>
            )}
          </div>
          <p className="text-[13px] text-txt-tertiary leading-tight truncate mt-0.5">
            {t.role}
            {t.university ? ` · ${t.university}` : ''}
            {t.affiliationType && AFFILIATION_LABELS[t.affiliationType]
              ? ` · ${AFFILIATION_LABELS[t.affiliationType]}`
              : ''}
          </p>
        </div>
      </div>

      {/* ── Body: 태그 + 소개 ── */}
      <div className="px-4 pb-3 flex-1">
        {t.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {t.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-brand bg-brand-bg text-[11px] font-medium px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {t.tags.length > 3 && (
              <span className="text-[11px] text-txt-disabled">+{t.tags.length - 3}</span>
            )}
          </div>
        )}
        {bio && (
          <p className="text-[13px] text-txt-tertiary leading-relaxed line-clamp-2">
            {bio}
          </p>
        )}
        {/* AI 정렬에서 매칭 세부 — 4축 breakdown. 매칭 이유 투명성 ↑ */}
        {peopleSortBy === 'ai' && t.matchDetails && (
          <MatchBreakdown details={t.matchDetails} />
        )}
      </div>

      {/* ── Footer: 상태 + 관심 ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border text-xs text-txt-tertiary">
        {statusConfig && (
          <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        )}
        {t.status === 'OPEN' && (
          <span className="text-brand flex items-center gap-1" title="커피챗 가능">
            <Coffee size={12} />
            <span className="text-[11px]">커피챗</span>
          </span>
        )}
        {t.interestCount > 0 && (
          <>
            <span className="text-border">·</span>
            <span>관심 {t.interestCount}</span>
          </>
        )}
      </div>
    </div>
  )
}

/* ── 매칭 4축 breakdown — 왜 이 점수인지 투명하게 보여 줌 ── */
function MatchBreakdown({
  details,
}: {
  details: { skill: number; interest: number; situation: number; teamfit: number }
}) {
  const axes: Array<{ key: keyof typeof details; label: string }> = [
    { key: 'skill',     label: '스킬' },
    { key: 'interest',  label: '관심' },
    { key: 'situation', label: '상황' },
    { key: 'teamfit',   label: '팀핏' },
  ]
  return (
    <div
      className="mt-2 pt-2 border-t border-border-subtle"
      title="매칭 점수는 스킬·관심·상황·팀핏 4축의 가중 평균입니다. 각 축 값은 0~100"
      aria-label="매칭 세부 점수"
    >
      <div className="grid grid-cols-4 gap-1.5">
        {axes.map(a => {
          const v = Math.max(0, Math.min(100, Math.round(details[a.key])))
          return (
            <div key={a.key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-1 mb-0.5">
                <span className="text-[9px] text-txt-tertiary">{a.label}</span>
                <span className="text-[9px] font-mono tabular-nums text-txt-secondary">{v}</span>
              </div>
              <div className="h-[3px] bg-surface-sunken rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand/60 rounded-full"
                  style={{ width: `${v}%` }}
                />
              </div>
            </div>
          )
        })}
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
          title="조건에 맞는 사람이 없습니다"
          description="검색·필터를 조금 넓히거나, 본인 프로필을 공개로 전환하면 다른 분들에게 발견될 수 있습니다. 프로필 공개 설정은 프로필 편집 화면에서 변경하실 수 있습니다."
          actionLabel="내 프로필 편집"
          actionHref="/profile"
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
