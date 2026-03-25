'use client'

import React from 'react'
import { cn } from '@/src/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  /** Left sidebar content (optional) */
  sidebar?: React.ReactNode
  /** Right aside content (optional) */
  aside?: React.ReactNode
  /** Max-width variant */
  size?: 'standard' | 'wide'
  /** Additional className */
  className?: string
}

const sizeMap = {
  standard: 'max-w-container-standard',
  wide: 'max-w-container-wide',
} as const

/**
 * Dashboard-style layout with optional sidebar and aside.
 * Designed to sit inside the (dashboard)/layout.tsx main area.
 *
 * Patterns:
 *   1-column:  <DashboardLayout>{content}</DashboardLayout>
 *   2-column:  <DashboardLayout sidebar={<Filters />}>{content}</DashboardLayout>
 *   3-column:  <DashboardLayout sidebar={<Nav />} aside={<Info />}>{content}</DashboardLayout>
 */
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebar,
  aside,
  size = 'wide',
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full max-w-full px-4 sm:px-8 lg:px-16 xl:px-24 py-6 overflow-x-hidden',
        className
      )}
    >
      <div className="flex gap-8 lg:gap-10">
        {/* Sidebar */}
        {sidebar && (
          <aside className="hidden lg:block w-56 shrink-0 sticky top-20 self-start">
            {sidebar}
          </aside>
        )}

        {/* Main content — takes remaining space */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

        {/* Right aside */}
        {aside && (
          <aside className="hidden xl:block w-64 shrink-0 sticky top-20 self-start">
            {aside}
          </aside>
        )}
      </div>
    </div>
  )
}
