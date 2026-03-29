'use client'

import React from 'react'

function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer border border-border ${className}`}
      {...props}
    />
  )
}

/** Card-shaped skeleton with optional rows */
function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-surface-card border border-border-strong p-4 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" style={{ width: `${85 - i * 10}%` }} />
      ))}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
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
    <div className="bg-surface-card border border-border-strong p-4 space-y-4">
      <Skeleton className="h-3 w-20" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  )
}

/** Profile skeleton */
function SkeletonProfile() {
  return (
    <div className="bg-surface-card border border-border-strong p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonGrid, SkeletonSidebar, SkeletonProfile }
