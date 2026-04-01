'use client'

import React, { useRef, useEffect } from 'react'
import Image from 'next/image'
import { Rocket, Users, FolderOpen, Eye, Heart } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAuth } from '@/src/context/AuthContext'
import { getUpdateBadge } from './constants'
import { Badges } from '@/components/ui/Badge'
import type { ProjectCard } from './types'

interface ExploreProjectGridProps {
  projectCards: ProjectCard[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hasMore: boolean
  isFetchingMore: boolean
  totalCount: number
  searchQuery: string
  selectedCategory: string
  recruitingOnly: boolean
  onLoadMore: () => void
  onSelectProject: (id: string) => void
}

export function ExploreProjectGrid({
  projectCards,
  isLoading,
  isError,
  onRetry,
  hasMore,
  isFetchingMore,
  totalCount,
  searchQuery,
  selectedCategory,
  recruitingOnly,
  onLoadMore,
  onSelectProject,
}: ExploreProjectGridProps) {
  const { isAuthenticated } = useAuth()
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

  if (isError) {
    return <ErrorState message="프로젝트를 불러오는 데 실패했습니다" onRetry={onRetry} />
  }

  if (isLoading) {
    return <SkeletonGrid count={6} cols={3} />
  }

  if (projectCards.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="등록된 프로젝트가 없습니다"
        description={isAuthenticated ? "첫 번째 프로젝트를 만들어 팀원을 모집해보세요" : "로그인하면 프로젝트를 만들 수 있어요"}
        actionLabel={isAuthenticated ? "프로젝트 만들기" : "로그인하기"}
        actionHref={isAuthenticated ? "/projects/new" : "/login"}
      />
    )
  }

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projectCards.map((p, index) => {
          const updateBadge = getUpdateBadge(p.updatedAt)
          const isUrgent = p.daysLeft > 0 && p.daysLeft <= 3
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProject(p.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProject(p.id) } }}
              style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
              className="stagger-item relative bg-surface-card rounded-xl border border-border overflow-hidden group hover:shadow-md hover:border-brand/30 hover:-translate-y-0.5 hover-spring cursor-pointer min-h-[21.25rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985] active:shadow-none active:border-brand/50"
            >
              {/* 헤더: 커버 */}
              <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
                {p.coverImage && (
                  <>
                    <Image src={p.coverImage} alt="" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" quality={85} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
                  </>
                )}
                <div className="absolute top-3 left-3 z-[1]">
                  {isUrgent ? (
                    <Tooltip text={`마감 ${p.daysLeft}일 전`} position="bottom">
                      <span className="text-[10px] font-mono font-bold bg-status-danger-text text-white px-2 py-0.5 border border-status-danger-text">D-{p.daysLeft} URGENT</span>
                    </Tooltip>
                  ) : (
                    <span className="text-[10px] font-mono font-bold bg-indicator-online text-white px-2 py-0.5 border border-indicator-online flex items-center gap-1">
                      <span className="w-1 h-1 bg-white animate-pulse" />
                      모집중
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1 z-[1]">
                  {p.matchLabel && (
                    <Tooltip text="AI가 프로필 기반으로 추천했어요">
                      <span className={`animate-badge-pop text-[10px] font-mono font-bold px-2 py-0.5 border flex items-center gap-1 ${
                        p.matchLabel === '잘 맞는 프로젝트'
                          ? 'bg-indicator-online text-white border-indicator-online'
                          : 'bg-black/80 backdrop-blur-sm text-white border-white/20'
                      }`}>
                        ✦ {p.matchLabel}
                      </span>
                    </Tooltip>
                  )}
                  {updateBadge && (
                    <span className="text-[10px] font-mono bg-amber-400 text-black px-2 py-0.5 font-bold border border-indicator-premium-border">{updateBadge}</span>
                  )}
                  {!updateBadge && !p.matchLabel && p.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] font-mono bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 border border-white/10">{tag}</span>
                  ))}
                </div>
                <div className="relative z-[1] w-10 h-10 bg-surface-card flex items-center justify-center shadow-sm border border-border">
                  <Rocket size={18} className="text-black" />
                </div>
              </div>
              {/* 본문 */}
              <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-base text-txt-primary truncate">{p.title}</h3>
                  <Badges badges={p.badges} />
                </div>
                <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                  <span className="text-[10px] font-medium text-brand shrink-0 bg-brand-bg px-1.5 py-0.5 border border-brand-border">NEED</span>
                  {p.roles.slice(0, 2).map(role => (
                    <span key={role} className="text-xs bg-surface-card text-txt-secondary px-2 py-0.5 border border-border font-medium shrink-0">{role}</span>
                  ))}
                </div>
                <p className="text-sm text-txt-secondary line-clamp-2">{p.desc}</p>
              </div>
              {/* 푸터 */}
              <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
                <div className="flex items-center justify-between w-full pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-surface-sunken rounded-xl border border-border flex items-center justify-center">
                      <Users size={10} className="text-txt-disabled" />
                    </div>
                    <span className="text-[10px] font-mono text-txt-tertiary">팀 모집중</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {p.viewsCount > 0 && (
                      <span className="flex items-center gap-1 text-txt-secondary"><Eye size={12} />{p.viewsCount}</span>
                    )}
                    {p.interestCount > 0 && (
                      <span className="flex items-center gap-1 text-status-danger-text/70"><Heart size={12} fill="currentColor" />{p.interestCount}</span>
                    )}
                    {p.daysLeft > 0 && (
                      <span className={`text-txt-tertiary ${isUrgent ? '!text-status-danger-text font-bold' : ''}`}>D-{p.daysLeft}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isFetchingMore && (
            <span className="text-xs font-mono text-txt-tertiary animate-pulse">로딩 중...</span>
          )}
        </div>
      )}
    </section>
  )
}
