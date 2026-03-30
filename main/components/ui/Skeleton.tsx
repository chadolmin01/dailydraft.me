'use client'

import React from 'react'

function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      {...props}
    />
  )
}

/** Card-shaped skeleton with realistic layout */
function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 space-y-3">
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
    <div className={`grid gap-4 ${cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/** Sidebar-shaped skeleton */
function SkeletonSidebar() {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 space-y-4">
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
    <div className="bg-surface-card border border-border rounded-xl p-6 space-y-4">
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
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-card border border-border rounded-xl p-4">
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
