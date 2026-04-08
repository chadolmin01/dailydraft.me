'use client'

import React, { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Rocket, Users, FolderOpen, Eye, Heart, Sparkles, ArrowRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useAuth } from '@/src/context/AuthContext'
import { getUpdateBadge } from './constants'
import { trackProjectView } from '@/src/lib/pwa/engagement-tracker'
import { Badges } from '@/components/ui/Badge'
import { CATEGORY_SLUGS } from '@/src/constants/categories'
import { useStaggerOnce } from '@/src/hooks/useStaggerOnce'
import type { ProjectCard } from './types'

function getCategoryCover(tags: string[]): string {
  const match = tags.find(t => CATEGORY_SLUGS.includes(t))
  return `/categories/${match ?? 'portfolio'}.svg`
}

const AI_GATE_COUNT = 3

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
  onPrefetchProject?: (id: string) => void
  sortBy?: string
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
  onPrefetchProject,
  sortBy,
}: ExploreProjectGridProps) {
  const { isAuthenticated } = useAuth()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const showAiGate = !isAuthenticated && sortBy === 'ai'

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore || showAiGate) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore() },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore, showAiGate])

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

  const visibleCards = showAiGate ? projectCards.slice(0, AI_GATE_COUNT) : projectCards
  const blurredCards = showAiGate ? projectCards.slice(AI_GATE_COUNT, AI_GATE_COUNT + 3) : []

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleCards.map((p, index) => (
          <ProjectCardItem
            key={p.id}
            card={p}
            index={index}
            onSelectProject={onSelectProject}
            onPrefetchProject={onPrefetchProject}
          />
        ))}
      </div>

      {/* AI 추천 로그인 게이트 */}
      {showAiGate && blurredCards.length > 0 && (
        <div className="relative mt-4">
          {/* 블러된 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 select-none pointer-events-none" aria-hidden="true">
            {blurredCards.map((p) => (
              <div key={p.id} className="relative bg-surface-card rounded-2xl shadow-sm overflow-hidden min-h-[21.25rem] flex flex-col blur-[6px] opacity-50">
                <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
                  <Image
                    src={p.coverImage ?? getCategoryCover(p.tags)}
                    alt=""
                    fill
                    sizes="(max-width:768px) 100vw, 50vw"
                    className="object-cover"
                    quality={40}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
                </div>
                <div className="px-5 pt-5 flex-1">
                  <div className="h-4 bg-surface-sunken rounded w-3/4 mb-3" />
                  <div className="h-3 bg-surface-sunken rounded w-1/2 mb-2" />
                  <div className="h-3 bg-surface-sunken rounded w-full" />
                </div>
              </div>
            ))}
          </div>

          {/* CTA 오버레이 */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-surface-bg/80 to-surface-bg">
            <div className="text-center px-6 py-8 max-w-sm">
              <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={22} className="text-brand" />
              </div>
              <p className="text-base font-bold text-txt-primary mb-2">
                지금 보고 있는 건 일반 정렬이에요
              </p>
              <p className="text-sm text-txt-secondary mb-6 leading-relaxed">
                로그인하면 내 스킬·관심사 기반으로<br />
                매칭률이 높은 순으로 정렬돼요
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-brand-hover transition-all active:scale-[0.97]"
              >
                1분 만에 시작하기
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {!showAiGate && hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isFetchingMore && (
            <span className="text-xs text-txt-tertiary animate-pulse">로딩 중...</span>
          )}
        </div>
      )}
    </section>
  )
}

/* ── 카드 아이템 (추출) ── */
function ProjectCardItem({ card: p, index, onSelectProject, onPrefetchProject }: {
  card: ProjectCard
  index: number
  onSelectProject: (id: string) => void
  onPrefetchProject?: (id: string) => void
}) {
  const updateBadge = getUpdateBadge(p.updatedAt)
  const isUrgent = p.daysLeft > 0 && p.daysLeft <= 3
  const staggerClass = useStaggerOnce(`project:${p.id}`)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { onSelectProject(p.id); trackProjectView() }}
      onMouseEnter={() => onPrefetchProject?.(p.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectProject(p.id) } }}
      style={staggerClass ? { animationDelay: `${Math.min(index * 60, 600)}ms` } : undefined}
      className={`${staggerClass} relative bg-surface-card rounded-2xl shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 hover-spring cursor-pointer min-h-[21.25rem] flex flex-col focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985] active:shadow-none`}
    >
      {/* 헤더: 커버 */}
      <div className="relative h-36 shrink-0 bg-surface-inverse flex items-end p-4">
        <>
          <Image
            src={p.coverImage ?? getCategoryCover(p.tags)}
            alt=""
            fill
            sizes="(max-width:768px) 100vw, 50vw"
            className="object-cover"
            quality={85}
            onError={(e) => { e.currentTarget.src = getCategoryCover(p.tags) }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />
        </>
        <div className="absolute top-3 left-3 z-[1]">
          {isUrgent ? (
            <span title={`마감 ${p.daysLeft}일 전`} className="text-[10px] font-semibold bg-status-danger-text text-white px-2.5 py-1 rounded-full">D-{p.daysLeft}</span>
          ) : (
            <span className="text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#34C759] rounded-full" />
              모집 중
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-[1]">
          {p.matchLabel && (
            <span title="AI가 프로필 기반으로 추천했어요" className={`animate-badge-pop text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              p.matchLabel === '잘 맞는 프로젝트'
                ? 'bg-[#34C759] text-white'
                : 'bg-black/70 backdrop-blur-sm text-white'
            }`}>
              ✦ {p.matchLabel}
            </span>
          )}
          {updateBadge && (
            <span className="text-[10px] font-medium bg-white/90 backdrop-blur-sm text-txt-secondary px-2.5 py-1 rounded-full">{updateBadge}</span>
          )}
          {!updateBadge && !p.matchLabel && p.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] font-medium bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">{tag}</span>
          ))}
        </div>
        <div className="relative z-[1] w-10 h-10 bg-surface-card rounded-xl flex items-center justify-center shadow-sm">
          <Rocket size={18} className="text-black" />
        </div>
      </div>
      {/* 본문 */}
      <div className="px-5 pt-5 h-[7.5rem] shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-bold text-base text-txt-primary truncate">{p.title}</h3>
          <Badges badges={p.badges} />
        </div>
        <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
          {p.roles.slice(0, 2).map(role => (
            <span key={role} className="text-[11px] bg-[#F2F3F5] dark:bg-[#2C2C2E] text-txt-secondary px-2.5 py-0.5 rounded-full font-medium shrink-0">{role}</span>
          ))}
        </div>
        <p className="text-sm text-txt-secondary line-clamp-2">{p.desc}</p>
      </div>
      {/* 푸터 */}
      <div className="px-5 pb-4 h-[4.75rem] shrink-0 flex items-end">
        <div className="flex items-center justify-between w-full pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-surface-sunken rounded-full flex items-center justify-center">
              <Users size={10} className="text-txt-disabled" />
            </div>
            <span className="text-[11px] text-txt-tertiary font-medium">모집 중</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px]">
            {p.viewsCount > 0 && (
              <span className="flex items-center gap-1 text-txt-tertiary"><Eye size={12} />{p.viewsCount}</span>
            )}
            {p.interestCount > 0 && (
              <span className="flex items-center gap-1 text-[#FF3B30]/70"><Heart size={12} fill="currentColor" />{p.interestCount}</span>
            )}
            {p.daysLeft > 0 && (
              <span className={`text-txt-tertiary ${isUrgent ? '!text-[#FF3B30] font-bold' : ''}`}>D-{p.daysLeft}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
