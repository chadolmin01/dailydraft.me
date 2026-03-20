import { TopNavbar } from '@/components/TopNavbar'
import { HelpWidget } from '@/components/HelpWidget'
import { RouteProgressBar } from '@/components/ui/RouteProgressBar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-bg">
      <RouteProgressBar />
      <TopNavbar />
      <main className="pt-20">
        <div className="min-h-[calc(100vh-5rem)]">
          {children}
        </div>
      </main>
      <HelpWidget />
    </div>
  )
}
