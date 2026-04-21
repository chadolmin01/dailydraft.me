'use client'

import { ViewTransitionLink as Link } from '@/components/ui/ViewTransitionLink'
import { usePathname } from 'next/navigation'
import { Compass, FolderKanban, User, Bell, Menu } from 'lucide-react'
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
  { key: 'projects',      label: '프로젝트', path: '/projects',      icon: FolderKanban },
  { key: 'profile',       label: '프로필',   path: '/profile',       icon: User },
  { key: 'explore',       label: null,     path: '/explore',       icon: Compass },   // center — highlight
  { key: 'notifications', label: '알림',   path: '/notifications', icon: Bell },
  { key: 'more',          label: '더보기', path: '/more',          icon: Menu },
] as const

export function BottomTabBar() {
  const pathname = usePathname()
  const { data: msgUnread = 0 } = useUnreadCount()
  const { data: notifUnread = 0 } = useUnreadNotificationCount()

  // 가드 제거: 항상 렌더 → auth race condition 영향 0, hydration 일관성 ↑
  // 비로그인 유저가 탭을 눌러도 middleware가 /login으로 리다이렉트함
  const segment = pathname?.split('/')[1] || 'explore'
  const totalMsgUnread = msgUnread || 0

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-fixed md:hidden bg-surface-card/[0.97] backdrop-blur-xl border-t border-border/20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center h-[3.25rem]">
        {TABS.map((tab) => {
          const isExplore = tab.key === 'explore'
          const isActive = segment === tab.key
            || (tab.key === 'more' && (segment === 'messages' || segment === 'settings'))
          const Icon = tab.icon

          // 배지: 알림탭엔 알림 수, 더보기탭엔 메시지 수
          const badge =
            tab.key === 'notifications' ? (notifUnread || 0)
            : tab.key === 'more' ? totalMsgUnread
            : 0
          const badgeText = badge > 0 ? (badge > 9 ? '9+' : String(badge)) : null

          // 중앙 탐색 — 하이라이트 스타일
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
                    : 'bg-surface-card shadow-sm'
                }`}>
                  <Icon
                    size={20}
                    className={isActive ? 'text-txt-inverse' : 'text-txt-primary'}
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
