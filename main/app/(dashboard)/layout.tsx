'use client'

import { TopNavbar } from '@/components/TopNavbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavbar />
      <main className="pt-16">
        <div className="min-h-[calc(100vh-64px)]">
          {children}
        </div>
      </main>
    </div>
  )
}
