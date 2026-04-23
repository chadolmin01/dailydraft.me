'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'

/**
 * 공통 알림 summary 훅 — TopNavbar bell badge + NotificationDropdown 양쪽에서 사용.
 *
 * 같은 queryKey(`['notifications']`) 를 공유해서 읽음 처리 mutation 이 invalidate 하면
 * 모든 구독자가 자동 갱신됨. 이전엔 mobile bell 이 별도 경로라 badge count 가 stale 로 남던 문제.
 */
export interface NotificationSummary {
  unreadCount: number
  isLoading: boolean
}

export function useNotificationSummary(): NotificationSummary {
  const { user, isLoading: isAuthLoading } = useAuth()

  const { data, isLoading } = useQuery<{ unread_count: number }>({
    // NotificationDropdown 과 동일 key — 캐시 공유
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=1')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !isAuthLoading && !!user,
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10_000,
  })

  return {
    unreadCount: data?.unread_count ?? 0,
    isLoading,
  }
}
