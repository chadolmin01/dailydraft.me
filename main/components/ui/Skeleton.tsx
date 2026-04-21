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

/** Grid of card skeletons */
function SkeletonGrid({ count = 4, cols = 2 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid gap-4 skeleton-delayed ${cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
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
        <div key={i} className="bg-surface-card rounded-xl border border-border p-4">
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

export { Skeleton, SkeletonCard, SkeletonGrid, SkeletonSidebar, SkeletonProfile, SkeletonFeed }
