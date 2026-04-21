import { TopNavbar } from '@/components/TopNavbar'
import { BottomTabBar } from '@/components/BottomTabBar'
import { InstallPrompt } from '@/components/InstallPrompt'
import { HelpWidget } from '@/components/HelpWidget'
import { RouteProgressBar } from '@/components/ui/RouteProgressBar'
import { PageTransition } from '@/components/ui/PageTransition'
import { CommandPalette } from '@/components/ui/CommandPalette'

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
      {/* view-transition-name: main — View Transitions API 지원 브라우저에서
          main element 를 named transition target 으로 지정. 현재 페이지의
          메인 컨텐츠만 크로스페이드 대상이 되어 상단 Navbar·하단 TabBar 는
          프레임 밖에 남아 "부동" 인상 (sidebar·header stability). */}
      <main
        id="main-content"
        className="pt-12 md:pt-14 pb-16 md:pb-0"
        style={{ viewTransitionName: 'main' }}
      >
        <div className="min-h-[calc(100vh-3.5rem)]">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <BottomTabBar />
      <HelpWidget />
      <CommandPalette />
    </div>
  )
}
