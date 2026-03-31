'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, FolderKanban, User, MessageSquare, Settings } from 'lucide-react'
import { useUnreadCount } from '@/src/hooks/useMessages'
import { useAuth } from '@/src/context/AuthContext'

const TABS = [
  { key: 'projects', label: 'MY', path: '/projects', icon: FolderKanban },
  { key: 'explore', label: 'EXPLORE', path: '/explore', icon: Compass },
  { key: 'messages', label: 'MESSAGES', path: '/messages', icon: MessageSquare },
  { key: 'profile', label: 'PROFILE', path: '/profile', icon: User },
  { key: 'settings', label: 'SETTINGS', path: '/profile/edit', icon: Settings },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { data: unreadCount = 0 } = useUnreadCount()

  if (!user || isLoading) return null

  const segment = pathname?.split('/')[1] || 'explore'
  const activeTab = segment === 'profile' && pathname?.includes('/edit') ? 'settings' : segment

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-fixed md:hidden bg-surface-card/[0.97] backdrop-blur-xl border-t border-border/40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-[3.25rem]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          const badge = tab.key === 'messages' ? unreadCount : 0
          const badgeText = badge > 0 ? (badge > 9 ? '9+' : String(badge)) : null

          return (
            <Link
              key={tab.key}
              href={tab.path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                isActive
                  ? 'text-txt-primary'
                  : 'text-txt-tertiary active:text-txt-secondary'
              }`}
            >
              {/* Active indicator — thin line at top */}
              {isActive && (
                <span className="absolute top-0 inset-x-0 mx-auto w-6 h-[2px] rounded-full bg-txt-primary" />
              )}

              <span className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
                {badgeText && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[0.875rem] h-[0.875rem] flex items-center justify-center px-0.5 bg-indicator-alert text-white text-[0.5rem] font-bold rounded-full leading-none">
                    {badgeText}
                  </span>
                )}
              </span>

              <span className={`text-[0.625rem] ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
