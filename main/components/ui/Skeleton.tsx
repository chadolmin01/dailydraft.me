'use client'

import React from 'react'

/**
 * Skeleton primitive — `skeleton-delayed` 을 default on 으로.
 * 400ms 안에 로딩이 끝나면 skeleton 자체가 눈에 띄지 않음 → 와이어프레임 깜빡임 제거.
 * 긴 로딩만 실제로 보이게. `immediate` prop 으로 이 기본값을 끌 수 있음
 * (테스트/스토리북 등).
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  immediate?: boolean
}

function Skeleton({ className = '', immediate = false, ...props }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer ${immediate ? '' : 'skeleton-delayed'} ${className}`}
      {...props}
    />
  )
}

/** Card-shaped skeleton with realistic layout */
function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-surface-card rounded-xl border border-border p-4 space-y-3 skeleton-delayed">
      {/* Header: avatar + title */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-2.5 w-16 rounded" />
        </div>
      </div>
      {/* Body lines */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 rounded" style={{ width: `${90 - i * 12}%` }} />
      ))}
      {/* Tags */}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </div>
  )
}

/** Grid of card skeletons — 카드마다 60ms stagger 로 계단식 등장 */
function SkeletonGrid({ count = 4, cols = 2 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid gap-4 skeleton-delayed ${cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 60}ms` }}
          className="skeleton-delayed"
        >
          <SkeletonCard />
        </div>
      ))}
    </div>
  )
}

/** Sidebar-shaped skeleton */
function SkeletonSidebar() {
  return (
    <div className="bg-surface-card rounded-xl border border-border p-4 space-y-4 skeleton-delayed">
      <Skeleton className="h-3 w-20 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <Skeleton className="h-3 flex-1 rounded" />
        </div>
      ))}
    </div>
  )
}

/** Profile skeleton */
function SkeletonProfile() {
  return (
    <div className="bg-surface-card rounded-xl border border-border p-6 space-y-4 skeleton-delayed">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <Skeleton className="h-px w-full rounded" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-4/5 rounded" />
      </div>
    </div>
  )
}

/** Feed-style skeleton — for explore/project lists */
function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 skeleton-delayed">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{ animationDelay: `${i * 60}ms` }}
          className="skeleton-delayed bg-surface-card rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-3 w-full rounded mb-2" />
          <Skeleton className="h-3 w-3/4 rounded mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** List-style skeleton — 짧은 목록(알림·멤버·메시지). 각 row 47px 높이, 4 lines */
function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <ul className="space-y-2 skeleton-delayed" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          style={{ animationDelay: `${i * 40}ms` }}
          className="skeleton-delayed bg-surface-card border border-border rounded-xl p-3 flex items-center gap-3"
        >
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/2 rounded" />
            <Skeleton className="h-2.5 w-1/3 rounded" />
          </div>
          <Skeleton className="h-2.5 w-10 rounded shrink-0" />
        </li>
      ))}
    </ul>
  )
}

/** Table-style skeleton — 관리자 테이블. 헤더 1 + body N rows */
function SkeletonTable({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div
      className="bg-surface-card border border-border rounded-xl overflow-hidden skeleton-delayed"
      aria-busy="true"
      aria-live="polite"
    >
      {/* header row */}
      <div
        className="grid gap-3 px-4 py-3 border-b border-border bg-surface-sunken/50"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: `${60 - i * 5}%` }} />
        ))}
      </div>
      {/* body rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 px-4 py-3 skeleton-delayed"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              animationDelay: `${r * 30}ms`,
            }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className="h-3 rounded"
                style={{ width: `${40 + ((r * 13 + c * 7) % 50)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Form-style skeleton — 설정·편집 페이지. label + input 3~6 pair */
function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div
      className="bg-surface-card border border-border rounded-2xl p-6 space-y-6 skeleton-delayed"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div
          key={i}
          className="space-y-2 skeleton-delayed"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      {/* footer action */}
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>
    </div>
  )
}

/** Detail-page skeleton — 프로젝트·프로필 상세. 상단 큰 커버 + 메타 + 본문 */
function SkeletonDetail() {
  return (
    <div
      className="space-y-6 skeleton-delayed"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Cover + title */}
      <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-6 w-3/4 rounded" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        </div>
      </div>
      {/* Meta row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-card border border-border rounded-xl p-4 space-y-1.5 skeleton-delayed"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Skeleton className="h-2.5 w-12 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
      {/* Body */}
      <div className="bg-surface-card border border-border rounded-2xl p-6 space-y-3">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-11/12 rounded" />
        <Skeleton className="h-3 w-10/12 rounded" />
        <Skeleton className="h-3 w-9/12 rounded" />
        <Skeleton className="h-3 w-11/12 rounded" />
      </div>
    </div>
  )
}

/** Stat/metric-row skeleton — 대시보드 상단 KPI */
function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-3 skeleton-delayed"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface-card border border-border rounded-xl p-4 space-y-2 skeleton-delayed"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <Skeleton className="h-2.5 w-16 rounded" />
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-2.5 w-12 rounded" />
        </div>
      ))}
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonGrid,
  SkeletonSidebar,
  SkeletonProfile,
  SkeletonFeed,
  SkeletonList,
  SkeletonTable,
  SkeletonForm,
  SkeletonDetail,
  SkeletonStats,
}
