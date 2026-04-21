'use client'

import React from 'react'
import { PrefetchLink as Link } from '@/components/ui/PrefetchLink'
import Image from 'next/image'
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
        <SkeletonGrid count={6} cols={2} />
      ) : clubs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="등록된 클럽이 없습니다"
          description="첫 번째 클럽을 만들어보세요"
          actionLabel="클럽 만들기"
          actionHref="/clubs/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clubs.map((club, index) => {
            const stagger = staggerOnceClass(`club:${club.id}`)
            return (
              <Link
                key={club.id}
                href={`/clubs/${club.slug}`}
                style={stagger ? { animationDelay: `${Math.min(index * 50, 500)}ms` } : undefined}
                className={`${stagger} h-[108px] flex items-start gap-3.5 p-4 bg-surface-card border border-border rounded-xl shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985]`}
              >
                {/* Logo: 52x52, rounded-md */}
                {club.logo_url ? (
                  <Image
                    src={club.logo_url}
                    alt={`${club.name} 로고`}
                    width={52}
                    height={52}
                    className="w-[52px] h-[52px] rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-md bg-surface-sunken flex items-center justify-center shrink-0">
                    <span className="text-lg font-extrabold text-txt-secondary">
                      {club.name[0]}
                    </span>
                  </div>
                )}

                {/* Info section */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: name + category badge */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-txt-primary truncate">
                      {club.name}
                    </h3>
                    {club.category && (
                      <span className="text-[10px] font-semibold text-brand bg-brand-bg px-2 py-0.5 rounded-full shrink-0">
                        {club.category}
                      </span>
                    )}
                  </div>

                  {/* Row 2: description (university/소개) */}
                  {club.description && (
                    <p className="text-xs text-txt-secondary truncate mt-1">
                      {club.description}
                    </p>
                  )}

                  {/* Row 3: stats */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-txt-tertiary">
                      <Users size={12} />
                      멤버 {club.member_count}명
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
