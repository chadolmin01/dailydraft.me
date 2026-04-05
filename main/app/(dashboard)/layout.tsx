import { TopNavbar } from '@/components/TopNavbar'
import { BottomTabBar } from '@/components/BottomTabBar'
import { InstallPrompt } from '@/components/InstallPrompt'
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
      <InstallPrompt />
      <TopNavbar />
      <main className="pt-0 md:pt-14 pb-16 md:pb-0">
        <div className="min-h-[calc(100vh-3.5rem)]">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <BottomTabBar />
      <HelpWidget />
    </div>
  )
}
