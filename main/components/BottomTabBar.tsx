'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, FolderKanban, User, MessageSquare, Bell } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useUnreadCount } from '@/src/hooks/useMessages'
import { useAuth } from '@/src/context/AuthContext'

function useUnreadNotificationCount() {
  const { user, isLoading } = useAuth()
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=1')
      if (!res.ok) return 0
      const data = await res.json()
      return (data.unread_count as number) || 0
    },
    enabled: !isLoading && !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

const TABS = [
  { key: 'projects', label: 'MY',     path: '/projects',      icon: FolderKanban },
  { key: 'messages', label: 'MSG',    path: '/messages',      icon: MessageSquare },
  { key: 'explore',  label: null,     path: '/explore',       icon: Compass },   // center — visual highlight
  { key: 'notifications', label: 'NOTIF', path: '/notifications', icon: Bell },
  { key: 'profile',  label: 'PROFILE', path: '/profile',     icon: User },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { data: msgUnread = 0 } = useUnreadCount()
  const { data: notifUnread = 0 } = useUnreadNotificationCount()

  if (!user || isLoading) return null

  const segment = pathname?.split('/')[1] || 'explore'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-fixed md:hidden bg-surface-card/[0.97] backdrop-blur-xl border-t border-border/40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center h-[3.25rem]">
        {TABS.map((tab) => {
          const isActive = segment === tab.key
          const Icon = tab.icon
          const isExplore = tab.key === 'explore'
          const badge =
            tab.key === 'messages' ? msgUnread
            : tab.key === 'notifications' ? notifUnread
            : 0
          const badgeText = badge > 0 ? (badge > 9 ? '9+' : String(badge)) : null

          if (isExplore) {
            return (
              <Link
                key={tab.key}
                href={tab.path}
                className="flex-1 flex items-center justify-center"
                aria-label="탐색"
              >
                <div className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-surface-inverse shadow-lg scale-105'
                    : 'bg-surface-inverse/85 shadow-md hover:scale-105'
                }`}>
                  <Icon
                    size={20}
                    className="text-txt-inverse"
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={tab.key}
              href={tab.path}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative transition-colors ${
                isActive ? 'text-txt-primary' : 'text-txt-tertiary active:text-txt-secondary'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-txt-primary" />
              )}

              <span className="relative">
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.5} />
                {badgeText && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[0.875rem] h-[0.875rem] flex items-center justify-center px-0.5 bg-indicator-alert text-white text-[0.5rem] font-bold rounded-full leading-none">
                    {badgeText}
                  </span>
                )}
              </span>

              <span className={`text-[9px] tracking-wide ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
