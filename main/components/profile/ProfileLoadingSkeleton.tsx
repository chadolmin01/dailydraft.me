'use client'

import { DashboardLayout } from '@/components/ui/DashboardLayout'

export function ProfileLoadingSkeleton() {
  return (
    <div className="bg-surface-bg min-h-full">
      <DashboardLayout
        size="wide"
        sidebar={
          <div className="space-y-4">
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-surface-sunken rounded-full mb-3 skeleton-shimmer" />
                <div className="h-4 bg-surface-sunken rounded w-20 mb-2 skeleton-shimmer" />
                <div className="h-3 bg-surface-sunken rounded w-24 skeleton-shimmer" />
              </div>
              <div className="h-9 bg-surface-sunken rounded-lg mt-4 skeleton-shimmer" />
            </div>
            <div className="bg-surface-card border border-border rounded-xl p-5">
              <div className="h-3 bg-surface-sunken rounded w-16 mb-4 skeleton-shimmer" />
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 bg-surface-sunken rounded-md skeleton-shimmer" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <div className="h-36 bg-surface-sunken border border-border rounded-xl mb-6 skeleton-shimmer" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-sunken border border-border rounded-xl skeleton-shimmer" />
          ))}
        </div>
      </DashboardLayout>
    </div>
  )
}
