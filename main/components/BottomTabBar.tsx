'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, FolderKanban, User, MessageSquare, Settings } from 'lucide-react'
import { useUnreadCount } from '@/src/hooks/useMessages'
import { useAuth } from '@/src/context/AuthContext'

const SIDE_TABS = [
  { key: 'projects', label: 'MY', path: '/projects', icon: FolderKanban },
  { key: 'profile', label: 'PROFILE', path: '/profile', icon: User },
  // center gap
  { key: 'messages', label: 'MESSAGES', path: '/messages', icon: MessageSquare },
  { key: 'settings', label: 'SETTINGS', path: '/profile/edit', icon: Settings },
] as const

const CENTER_TAB = { key: 'explore', label: 'EXPLORE', path: '/explore', icon: Compass }

export function BottomTabBar() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { data: unreadCount = 0 } = useUnreadCount()

  if (!user || isLoading) return null

  const segment = pathname?.split('/')[1] || 'explore'
  // settings 탭은 /profile/edit 경로
  const activeTab = segment === 'profile' && pathname?.includes('/edit') ? 'settings' : segment

  const leftTabs = SIDE_TABS.slice(0, 2)
  const rightTabs = SIDE_TABS.slice(2)
  const isCenterActive = activeTab === CENTER_TAB.key

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-fixed md:hidden bg-surface-card/95 backdrop-blur-md border-t-2 border-border-strong"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-end h-14 relative">
        {/* Left tabs */}
        {leftTabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            badge={tab.key === 'messages' ? unreadCount : 0}
          />
        ))}

        {/* Center: EXPLORE — raised circle */}
        <div className="flex-1 flex justify-center">
          <Link
            href={CENTER_TAB.path}
            className={`relative -mt-4 w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-lg transition-all active:scale-90 ${
              isCenterActive
                ? 'bg-brand border-brand text-white shadow-brand/30'
                : 'bg-surface-inverse border-border-strong text-txt-inverse shadow-black/15 hover:shadow-black/25'
            }`}
          >
            <Compass size={26} strokeWidth={isCenterActive ? 2.5 : 2} />
          </Link>
        </div>

        {/* Right tabs */}
        {rightTabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            badge={tab.key === 'messages' ? unreadCount : 0}
          />
        ))}
      </div>
    </nav>
  )
}

function TabItem({
  tab,
  isActive,
  badge,
}: {
  tab: { key: string; label: string; path: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }
  isActive: boolean
  badge: number
}) {
  const Icon = tab.icon
  const badgeText = badge > 0 ? (badge > 9 ? '9+' : String(badge)) : null

  return (
    <Link
      href={tab.path}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
        isActive
          ? 'text-brand'
          : 'text-txt-tertiary active:bg-surface-sunken'
      }`}
    >
      {isActive && (
        <span className="absolute top-0 left-auto w-8 h-0.5 bg-brand" />
      )}

      <span className="relative">
        <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
        {badgeText && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[1rem] h-4 flex items-center justify-center px-1 bg-brand text-white text-[0.5625rem] font-bold rounded-full leading-none">
            {badgeText}
          </span>
        )}
      </span>

      <span className="text-[0.625rem] font-mono font-bold uppercase tracking-wider">
        {tab.label}
      </span>
    </Link>
  )
}
