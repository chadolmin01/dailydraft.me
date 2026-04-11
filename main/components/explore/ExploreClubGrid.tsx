'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { staggerOnceClass } from '@/src/hooks/useStaggerOnce'
import type { ClubCard } from './types'

interface ExploreClubGridProps {
  clubs: ClubCard[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function ExploreClubGrid({
  clubs,
  isLoading,
  isError,
  onRetry,
}: ExploreClubGridProps) {
  return (
    <section>
      {isError ? (
        <ErrorState message="클럽 목록을 불러오는 데 실패했습니다" onRetry={onRetry} />
      ) : isLoading ? (
        <SkeletonGrid count={6} cols={3} />
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="등록된 클럽이 없습니다"
          description="클럽을 만들면 여기에 표시됩니다"
        />
      ) : (
        <>
          {/* Mobile: compact list */}
          <div className="flex flex-col gap-2 md:hidden">
            {clubs.map((club, index) => {
              const stagger = staggerOnceClass(`club-m:${club.id}`)
              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  style={stagger ? { animationDelay: `${Math.min(index * 40, 400)}ms` } : undefined}
                  className={`${stagger} flex items-center gap-3 px-4 py-4 bg-surface-card rounded-2xl shadow-sm hover:shadow-md hover-spring active:scale-[0.985] transition-all`}
                >
                  <div className="w-10 h-10 rounded-lg bg-bg-sunken flex items-center justify-center text-sm font-extrabold text-txt-secondary shrink-0">
                    {club.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-txt-primary truncate">{club.name}</span>
                      {club.category && (
                        <span className="text-[10px] font-medium text-brand bg-brand-bg px-1.5 py-0.5 rounded-full shrink-0">{club.category}</span>
                      )}
                    </div>
                    {club.description && (
                      <p className="text-xs text-txt-tertiary truncate mt-0.5">{club.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-txt-tertiary shrink-0">
                    <Users size={11} />
                    <span>{club.member_count}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Desktop: card grid */}
          <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {clubs.map((club, index) => {
              const stagger = staggerOnceClass(`club-d:${club.id}`)
              return (
                <Link
                  key={club.id}
                  href={`/clubs/${club.slug}`}
                  style={stagger ? { animationDelay: `${Math.min(index * 60, 600)}ms` } : undefined}
                  className={`${stagger} bg-surface-card rounded-2xl shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 hover-spring h-[11rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985] active:shadow-none`}
                >
                  <div className="px-5 pt-5 flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-bg-sunken flex items-center justify-center text-base font-extrabold text-txt-secondary shrink-0">
                      {club.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-base text-txt-primary truncate">{club.name}</h3>
                        {club.category && (
                          <span className="text-[10px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full shrink-0">{club.category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-txt-tertiary">
                        <Users size={11} />
                        <span>멤버 {club.member_count}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pt-3 flex-1 overflow-hidden">
                    {club.description && (
                      <p className="text-sm text-txt-tertiary line-clamp-2">{club.description}</p>
                    )}
                  </div>
                  <div className="px-5 pb-4 flex items-end">
                    <span className="text-[11px] font-medium text-brand">자세히 보기 →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
