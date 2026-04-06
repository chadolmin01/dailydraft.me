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
          description="프로필을 공개하면 여기에 표시돼요"
        />
      ) : (
        <>
          {/* ── Mobile: compact horizontal list ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {talentCards.map((t, index) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProfile(t.id, false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProfile(t.id, false) } }}
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                className="stagger-item relative bg-surface-card rounded-2xl shadow-sm overflow-hidden flex items-center gap-3 px-4 py-4 cursor-pointer hover:shadow-md hover-spring focus-visible:ring-2 focus-visible:ring-accent outline-none active:scale-[0.985]"
              >
                <div className="relative w-10 h-10 bg-brand-bg border border-brand-border rounded-full flex items-center justify-center text-sm font-bold text-brand shrink-0 overflow-hidden">
                  {t.name.substring(0, 2)}
                  {t.avatarUrl && (
                    <Image src={t.avatarUrl} alt={t.name} width={40} height={40} className="absolute inset-0 w-full h-full object-cover" quality={85} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm text-txt-primary truncate">{t.name}</h3>
                    <Badges badges={t.badges} />
                    {peopleSortBy === 'ai' && t.matchScore != null && t.matchScore > 0 ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getMatchColorClass(t.matchScore)}`}>
                        {t.matchScore}%
                      </span>
                    ) : (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        t.status === 'OPEN' ? 'bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759]'
                        : t.status === 'BUSY' ? 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-tertiary'
                        : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-tertiary'
                      }`}>
                        {t.status === 'OPEN' ? '가능' : t.status === 'BUSY' ? '바쁨' : t.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-txt-secondary truncate">
                    {t.university || t.role}
                    {t.affiliationType && AFFILIATION_LABELS[t.affiliationType] ? ` · ${AFFILIATION_LABELS[t.affiliationType]}` : ''}
                  </p>
                  {t.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                      {t.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary px-2 py-0.5 rounded-full font-medium shrink-0">{tag}</span>
                      ))}
                      {t.tags.length > 3 && (
                        <span className="text-[10px] text-txt-disabled">+{t.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                {t.status === 'OPEN' && (
                  <span title="커피챗 가능">
                    <Coffee size={14} className="text-[#34C759] shrink-0" />
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Desktop: full card grid ── */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {talentCards.map((t, index) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProfile(t.id, false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProfile(t.id, false) } }}
                style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
                className="stagger-item relative bg-surface-card rounded-2xl shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 hover-spring cursor-pointer h-[13.75rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985] active:shadow-none"
              >
                <div className="px-5 pt-5 h-[4.75rem] shrink-0">
                  <div className="flex gap-3">
                    <div className="relative w-12 h-12 bg-brand-bg border border-brand-border rounded-full flex items-center justify-center text-base font-bold text-brand shrink-0 overflow-hidden">
                      {t.name.substring(0, 2)}
                      {t.avatarUrl && (
                        <Image src={t.avatarUrl} alt={t.name} width={48} height={48} className="absolute inset-0 w-full h-full object-cover" quality={85} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-base text-txt-primary truncate">{t.name}</h3>
                        <Badges badges={t.badges} />
                        {peopleSortBy === 'ai' && t.matchScore != null && t.matchScore > 0 ? (
                          <span title="AI 프로필 유사도" className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getMatchColorClass(t.matchScore)}`}>
                            {t.matchScore}%
                          </span>
                        ) : (
                          <span title={t.status === 'OPEN' ? '커피챗/협업 가���' : t.status === 'BUSY' ? '바쁨 · 메시지 가능' : '현재 불가'} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            t.status === 'OPEN' ? 'bg-[#E8F5E9] dark:bg-[#1B3A2D] text-[#34C759]'
                            : t.status === 'BUSY' ? 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-tertiary'
                            : 'bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-tertiary'
                          }`}>
                            {t.status === 'OPEN' ? '가능' : t.status === 'BUSY' ? '바쁨' : t.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-txt-secondary truncate">
                        {t.university || t.role}
                        {t.affiliationType && AFFILIATION_LABELS[t.affiliationType] ? ` · ${AFFILIATION_LABELS[t.affiliationType]}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-5 h-[5.75rem] shrink-0 overflow-hidden">
                  {peopleSortBy === 'ai' && t.matchReason ? (
                    <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">{t.matchReason}</p>
                  ) : t.visionSummary ? (
                    <p className="text-sm text-txt-tertiary line-clamp-2 mb-2">{t.visionSummary}</p>
                  ) : null}
                  {t.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {t.tags.map(tag => (
                        <span key={tag} className="text-[11px] bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary px-2.5 py-0.5 rounded-full font-medium shrink-0">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-5 pb-4 h-[3.25rem] shrink-0 flex items-end">
                  <div className="flex items-center justify-between w-full pt-2 border-t border-border/50">
                    <span className="text-[11px] text-txt-tertiary">{t.role}</span>
                    {t.status === 'OPEN' ? (
                      <span className="text-[10px] font-semibold text-[#34C759] flex items-center gap-1 bg-[#E8F5E9] dark:bg-[#1B3A2D] px-2.5 py-1 rounded-full"><Coffee size={9} /> 가능</span>
                    ) : (
                      <span className="text-[10px] font-medium text-txt-tertiary flex items-center gap-1 bg-[#F2F3F5] dark:bg-[#2C2C2E] px-2.5 py-1 rounded-full">{t.status === 'BUSY' ? '바쁨' : t.status}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
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
