'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Briefcase, User, MessageSquare } from 'lucide-react'
import { useUnreadCount } from '@/src/hooks/useMessages'
import { useAuth } from '@/src/context/AuthContext'

const TABS = [
  { key: 'explore', label: 'FEED', path: '/explore', icon: Compass },
  { key: 'projects', label: 'PROJECTS', path: '/projects', icon: Briefcase },
  { key: 'profile', label: 'PROFILE', path: '/profile', icon: User },
  { key: 'messages', label: 'MESSAGES', path: '/messages', icon: MessageSquare },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { data: unreadCount = 0 } = useUnreadCount()

  if (!user || isLoading) return null

  const activeTab = pathname?.split('/')[1] || 'explore'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-fixed md:hidden border-t-2 border-border-strong bg-surface-card/95 backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex h-14">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const Icon = tab.icon
          const badge = tab.key === 'messages' && unreadCount > 0
            ? unreadCount > 9 ? '9+' : String(unreadCount)
            : null

          return (
            <Link
              key={tab.key}
              href={tab.path}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? 'text-brand'
                  : 'text-txt-tertiary active:bg-surface-sunken'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-brand" />
              )}

              <span className="relative">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                {badge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[1rem] h-4 flex items-center justify-center px-1 bg-brand text-white text-[0.5625rem] font-bold rounded-full leading-none">
                    {badge}
                  </span>
                )}
              </span>

              <span className="text-[0.5625rem] font-mono font-bold uppercase tracking-wider">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
