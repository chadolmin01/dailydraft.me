'use client'

import { TopNavbar } from '@/components/TopNavbar'
import { HelpWidget } from '@/components/HelpWidget'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-bg">
      <TopNavbar />
      <main className="pt-14">
        <div className="min-h-[calc(100vh-56px)]">
          {children}
        </div>
      </main>
      <HelpWidget />
    </div>
  )
}
