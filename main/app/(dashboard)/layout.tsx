import { TopNavbar } from '@/components/TopNavbar'
import { BottomTabBar } from '@/components/BottomTabBar'
import { HelpWidget } from '@/components/HelpWidget'
import { RouteProgressBar } from '@/components/ui/RouteProgressBar'
import { PageTransition } from '@/components/ui/PageTransition'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-bg">
      <RouteProgressBar />
      <TopNavbar />
      <main className="pt-14 sm:pt-20 pb-16 md:pb-0">
        <div className="min-h-[calc(100vh-5rem)]">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <BottomTabBar />
      <HelpWidget />
    </div>
  )
}
