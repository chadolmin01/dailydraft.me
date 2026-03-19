'use client'

import { DashboardLayout } from '@/components/ui/DashboardLayout'

export function ProfileLoadingSkeleton() {
  return (
    <div className="bg-surface-bg min-h-full">
      <DashboardLayout
        size="wide"
        sidebar={
          <div className="space-y-4 animate-pulse">
            <div className="bg-surface-card border border-border-strong p-4 shadow-sharp">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-surface-sunken border border-border mb-3" />
                <div className="h-4 bg-surface-sunken w-20 mb-2" />
                <div className="h-3 bg-border-subtle w-24" />
              </div>
              <div className="h-9 bg-surface-sunken mt-4" />
            </div>
            <div className="bg-surface-card border border-border-strong p-4 shadow-sharp">
              <div className="h-3 bg-surface-sunken w-16 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 bg-surface-sunken" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <div className="h-36 bg-surface-sunken border border-border-strong mb-6 animate-pulse" />
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-sunken border border-border-strong" />
          ))}
        </div>
      </DashboardLayout>
    </div>
  )
}
