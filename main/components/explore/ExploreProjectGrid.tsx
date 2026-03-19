'use client'

import React from 'react'
import Image from 'next/image'
import { Rocket, Users, FolderOpen } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
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
  totalCount,
  searchQuery,
  selectedCategory,
  recruitingOnly,
  onLoadMore,
  onSelectProject,
}: ExploreProjectGridProps) {
  const { isAuthenticated } = useAuth()

  if (isError) {
    return <ErrorState message="프로젝트를 불러오는 데 실패했습니다" onRetry={onRetry} />
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="bg-surface-card border border-border-strong overflow-hidden h-[21.25rem] flex flex-col animate-pulse">
            <div className="h-36 shrink-0 bg-surface-sunken" />
            <div className="px-4 pt-4 flex-1 space-y-3">
              <div className="h-4 bg-surface-sunken w-3/4" />
              <div className="h-3 bg-surface-sunken w-full" />
              <div className="h-3 bg-surface-sunken w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectCards.map((p) => {
          const updateBadge = getUpdateBadge(p.updatedAt)
          const isUrgent = p.daysLeft > 0 && p.daysLeft <= 3
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProject(p.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProject(p.id) } }}
              className="relative bg-surface-card border border-border-strong overflow-hidden group hover:shadow-solid-sm hover:border-brand/30 transition-all cursor-pointer h-[21.25rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985] active:shadow-none active:border-brand/50"
            >
              {/* 코너 마크 */}
              <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-black/15 z-20" />
              <div className="absolute top-1 right-1 w-2 h-2 border-r border-t border-black/15 z-20" />
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
                    <span className="text-[0.625rem] font-mono font-bold bg-status-danger-text text-white px-2 py-0.5 border border-status-danger-text">D-{p.daysLeft} URGENT</span>
                  ) : (
                    <span className="text-[0.625rem] font-mono font-bold bg-indicator-online text-white px-2 py-0.5 border border-indicator-online flex items-center gap-1">
                      <span className="w-1 h-1 bg-white animate-pulse" />
                      모집중
                    </span>
                  )}
                </div>
                <div className="absolute top-3 right-3 flex gap-1 z-[1]">
                  {updateBadge && (
                    <span className="text-[0.625rem] font-mono bg-amber-400 text-black px-2 py-0.5 font-bold border border-indicator-premium-border">{updateBadge}</span>
                  )}
                  {!updateBadge && p.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[0.625rem] font-mono bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 border border-white/10">{tag}</span>
                  ))}
                </div>
                <div className="relative z-[1] w-10 h-10 bg-surface-card flex items-center justify-center shadow-solid-sm border border-border-strong">
                  <Rocket size={18} className="text-black" />
                </div>
              </div>
              {/* 본문 */}
              <div className="px-4 pt-4 h-[7.5rem] shrink-0 overflow-hidden">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-bold text-base text-txt-primary truncate">{p.title}</h3>
                  <Badges badges={p.badges} />
                  {p.matchLabel && (
                    <span className={`text-[0.625rem] font-mono font-bold px-1.5 py-0.5 border shrink-0 ${
                      p.matchLabel === '잘 맞는 프로젝트' ? 'bg-status-success-bg text-status-success-text border-indicator-online/20'
                      : 'bg-brand-bg text-brand border-brand-border'
                    }`}>
                      {p.matchLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                  <span className="text-[0.625rem] font-mono font-bold text-brand uppercase tracking-wide shrink-0 bg-brand-bg px-1.5 py-0.5 border border-brand-border">NEED</span>
                  {p.roles.slice(0, 2).map(role => (
                    <span key={role} className="text-xs bg-surface-sunken text-txt-secondary px-2 py-0.5 border border-border font-medium shrink-0">{role}</span>
                  ))}
                </div>
                <p className="text-sm text-txt-secondary line-clamp-2">{p.desc}</p>
              </div>
              {/* 푸터 */}
              <div className="px-4 pb-4 h-[4.75rem] shrink-0 flex items-end">
                <div className="flex items-center justify-between w-full pt-3 border-t border-dashed border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-surface-sunken border border-border flex items-center justify-center">
                      <Users size={10} className="text-txt-disabled" />
                    </div>
                    <span className="text-[0.625rem] font-mono text-txt-tertiary">팀 모집중</span>
                  </div>
                  <div className="flex items-center gap-3 text-[0.625rem] font-mono text-txt-tertiary">
                    {p.daysLeft > 0 && (
                      <span className={isUrgent ? 'text-status-danger-text font-bold' : ''}>D-{p.daysLeft}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {hasMore && !isLoading && (
        <div className="text-center mt-6">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 text-sm font-bold text-txt-secondary border border-border-strong hover:bg-surface-sunken hover:shadow-sharp transition-all active:scale-[0.97] active:shadow-none"
          >
            더 보기{!searchQuery && selectedCategory === 'all' && !recruitingOnly ? ` (${totalCount - projectCards.length}개 남음)` : ''}
          </button>
        </div>
      )}
    </section>
  )
}
