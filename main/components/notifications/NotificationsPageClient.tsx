'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
import { PageContainer } from '@/components/ui/PageContainer'
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  UserCheck,
  UserX,
  Link2,
  Clock,
  Coffee,
  MessageSquare,
  Loader2,
  UserPlus,
} from 'lucide-react'
import { PushNotificationBanner } from '@/components/ui/PushNotificationBanner'

interface Notification {
  id: string
  notification_type: string
  title: string
  message: string
  status: 'unread' | 'read' | 'dismissed'
  link: string | null
  created_at: string
  read_at: string | null
  metadata: Record<string, string> | null
}

interface NotificationsResponse {
  notifications: Notification[]
  unread_count: number
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; readColor: string }> = {
  application_received: { icon: FileText, color: 'text-status-info-text bg-status-info-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  application_accepted: { icon: UserCheck, color: 'text-status-success-text bg-status-success-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  application_rejected: { icon: UserX, color: 'text-status-danger-text bg-status-danger-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  connection: { icon: Link2, color: 'text-brand bg-brand-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  deadline: { icon: Clock, color: 'text-indicator-trending bg-status-warning-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  coffee_chat: { icon: Coffee, color: 'text-indicator-premium-border bg-status-warning-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  project_invitation: { icon: UserPlus, color: 'text-brand bg-brand-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  comment: { icon: MessageSquare, color: 'text-txt-secondary bg-surface-sunken', readColor: 'text-txt-disabled bg-surface-sunken' },
  recommendation: { icon: Check, color: 'text-status-info-text bg-status-info-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  new_match: { icon: Check, color: 'text-indicator-online bg-status-success-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
}

const defaultConfig = { icon: Bell, color: 'text-txt-secondary bg-surface-sunken', readColor: 'text-txt-disabled bg-surface-sunken' }

type CategoryKey = 'all' | 'match' | 'project' | 'coffee' | 'comment' | 'deadline'

// 카테고리 → notification_type 매핑.
// "기타"는 명시 카테고리 어디에도 안 잡히는 타입을 위한 안전망 — 새 타입이 추가돼도 "전체"에는 잡히도록.
const CATEGORY_TYPES: Record<Exclude<CategoryKey, 'all'>, string[]> = {
  match: ['new_match', 'recommendation', 'connection'],
  project: ['application_received', 'application_accepted', 'application_rejected', 'project_invitation'],
  coffee: ['coffee_chat'],
  comment: ['comment'],
  deadline: ['deadline'],
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: '전체',
  match: '매칭',
  project: '프로젝트',
  coffee: '커피챗',
  comment: '댓글',
  deadline: '마감',
}

const CATEGORY_ORDER: CategoryKey[] = ['all', 'match', 'project', 'coffee', 'comment', 'deadline']

function categoryOf(type: string): Exclude<CategoryKey, 'all'> | null {
  for (const [cat, types] of Object.entries(CATEGORY_TYPES)) {
    if (types.includes(type)) return cat as Exclude<CategoryKey, 'all'>
  }
  return null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default function NotificationsPageClient() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()
  const [showAll, setShowAll] = useState(false)
  const [category, setCategory] = useState<CategoryKey>('all')

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'full'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=50')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !isAuthLoading && !!user,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2분
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const keys = [['notifications'], ['notifications', 'full']]
      const prevs: Record<string, NotificationsResponse | undefined> = {}
      for (const key of keys) {
        const prev = queryClient.getQueryData<NotificationsResponse>(key)
        prevs[key.join('.')] = prev
        if (prev) {
          queryClient.setQueryData<NotificationsResponse>(key, {
            ...prev,
            unread_count: Math.max(0, prev.unread_count - 1),
            notifications: prev.notifications.map((n) =>
              n.id === id ? { ...n, status: 'read' as const, read_at: new Date().toISOString() } : n
            ),
          })
        }
      }
      return { prevs }
    },
    onError: (_err, _id, context) => {
      if (context?.prevs) {
        for (const [key, prev] of Object.entries(context.prevs)) {
          if (prev) queryClient.setQueryData(key.split('.'), prev)
        }
      }
      toast.error('알림 읽음 처리에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
      if (!res.ok) throw new Error('Failed')
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const keys = [['notifications'], ['notifications', 'full']]
      const prevs: Record<string, NotificationsResponse | undefined> = {}
      for (const key of keys) {
        const prev = queryClient.getQueryData<NotificationsResponse>(key)
        prevs[key.join('.')] = prev
        if (prev) {
          queryClient.setQueryData<NotificationsResponse>(key, {
            ...prev,
            unread_count: 0,
            notifications: prev.notifications.map((n) => ({
              ...n,
              status: 'read' as const,
              read_at: n.read_at || new Date().toISOString(),
            })),
          })
        }
      }
      return { prevs }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevs) {
        for (const [key, prev] of Object.entries(context.prevs)) {
          if (prev) queryClient.setQueryData(key.split('.'), prev)
        }
      }
      toast.error('모두 읽음 처리에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const handleNotificationClick = useCallback((n: Notification) => {
    if (n.status === 'unread') {
      markReadMutation.mutate(n.id)
    }
    if (n.link) {
      router.push(n.link)
    }
  }, [markReadMutation, router])

  const allNotifications = data?.notifications ?? []
  const unreadCount = data?.unread_count ?? 0
  const unreadNotifications = allNotifications.filter((n) => n.status === 'unread')

  // 카테고리별 unread 카운트 — 칩 옆 회색 숫자.
  // 전체 unread 안에서 집계하는 이유: "새 알림" 탭/"전체 내역" 탭 어느 쪽이든
  // 사용자 관심사는 "이 카테고리에 안 본 게 몇 개인가" 이기 때문.
  const categoryUnreadCounts: Record<CategoryKey, number> = {
    all: unreadCount,
    match: 0,
    project: 0,
    coffee: 0,
    comment: 0,
    deadline: 0,
  }
  for (const n of unreadNotifications) {
    const cat = categoryOf(n.notification_type)
    if (cat) categoryUnreadCounts[cat] += 1
  }

  const baseList = showAll ? allNotifications : unreadNotifications
  const displayList =
    category === 'all'
      ? baseList
      : baseList.filter((n) => categoryOf(n.notification_type) === category)

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="standard" className="py-6">
        <PushNotificationBanner />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-txt-primary mb-1 flex items-center gap-2">
              <Bell size={20} /> 알림
            </h1>
            <p className="text-sm text-txt-tertiary">
              {unreadCount > 0 ? `${unreadCount}개의 새 알림` : '새 알림 없음'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-txt-secondary border border-border hover:bg-surface-sunken transition-all"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              모두 읽음
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setShowAll(false)}
            className={`px-4 py-1.5 text-xs font-bold transition-all ${
              !showAll
                ? 'bg-surface-inverse text-txt-inverse'
                : 'text-txt-tertiary hover:text-txt-primary border border-transparent hover:border-border'
            }`}
          >
            새 알림{unreadCount > 0 && ` (${unreadCount})`}
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`px-4 py-1.5 text-xs font-bold transition-all ${
              showAll
                ? 'bg-surface-inverse text-txt-inverse'
                : 'text-txt-tertiary hover:text-txt-primary border border-transparent hover:border-border'
            }`}
          >
            전체 내역
          </button>
        </div>

        {/* Category Filter — 칩은 항상 노출하되 카운트는 unread 0 이면 회색 톤다운.
            거슬림 최소화: 빨간 뱃지 X, 점(dot) X, 작은 회색 숫자만. */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {CATEGORY_ORDER.map((key) => {
            const count = categoryUnreadCounts[key]
            const active = category === key
            const hasUnread = count > 0
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-2.5 py-1 text-[11px] rounded-full transition-colors border ${
                  active
                    ? 'border-txt-primary text-txt-primary bg-surface-card'
                    : 'border-border text-txt-tertiary hover:text-txt-primary hover:border-txt-tertiary'
                }`}
              >
                {CATEGORY_LABELS[key]}
                {hasUnread && (
                  <span className={`ml-1 ${active ? 'text-txt-tertiary' : 'text-txt-disabled'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Notification List */}
        <div className="bg-surface-card rounded-xl shadow-sm">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-10 h-10 bg-surface-sunken rounded skeleton-shimmer shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-sunken rounded skeleton-shimmer w-48" />
                    <div className="h-3 bg-surface-sunken rounded skeleton-shimmer w-full" />
                    <div className="h-2.5 bg-surface-sunken rounded skeleton-shimmer w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-txt-tertiary bell-swing" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] font-semibold text-txt-primary mb-1.5">
                {category !== 'all'
                  ? `${CATEGORY_LABELS[category]} 알림이 없습니다`
                  : showAll
                    ? '알림 내역이 없습니다'
                    : '새로운 알림이 없습니다'}
              </p>
              <p className="text-[12px] text-txt-tertiary max-w-sm mx-auto leading-relaxed">
                아래 상황이 발생하면 이곳에 모아집니다.
              </p>
              <ul className="text-[12px] text-txt-secondary mt-3 inline-block text-left space-y-1">
                <li>· 프로젝트 지원·초대·수락</li>
                <li>· 커피챗·메시지 수신</li>
                <li>· 클럽 운영자의 공지</li>
                <li>· 주간 업데이트 Ghostwriter 초안 완료</li>
              </ul>
              <p className="text-[11px] text-txt-tertiary mt-4">
                알림 설정은{' '}
                <Link href="/profile/settings" className="text-brand underline">
                  프로필 설정
                </Link>
                에서 조정하실 수 있습니다.
              </p>
              {!showAll && allNotifications.length > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-[12px] text-txt-tertiary hover:text-txt-primary mt-4 underline underline-offset-2"
                >
                  이전 알림 보기 ({allNotifications.length}개)
                </button>
              )}
            </div>
          ) : (
            displayList.map((n) => {
              const config = typeConfig[n.notification_type] || defaultConfig
              const Icon = config.icon
              const isUnread = n.status === 'unread'

              return (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full flex items-start gap-4 px-5 py-5 text-left transition-colors border-b border-border/40 last:border-b-0 ${
                    isUnread
                      ? 'hover:bg-surface-sunken'
                      : 'opacity-50 hover:opacity-70'
                  }`}
                >
                  <div className={`w-10 h-10 flex items-center justify-center shrink-0 mt-0.5 ${
                    isUnread ? config.color : config.readColor
                  }`}>
                    {/* @ts-expect-error Icon은 lucide 아이콘이므로 size prop 지원 */}
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm line-clamp-1 ${
                        isUnread
                          ? 'font-semibold text-txt-primary'
                          : 'text-txt-disabled line-through decoration-gray-300'
                      }`}>
                        {n.title}
                      </p>
                      {isUnread && (
                        <span className="w-2 h-2 bg-brand rounded-full shrink-0" />
                      )}
                    </div>
                    <p className={`text-xs line-clamp-2 mt-0.5 ${
                      isUnread ? 'text-txt-tertiary' : 'text-txt-disabled'
                    }`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-txt-disabled mt-1.5 flex items-center gap-1.5">
                      {timeAgo(n.created_at)}
                      {!isUnread && ' · 확인됨'}
                      {n.metadata?.discord_dm_sent === 'true' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#5865F2]">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                          DM 전송됨
                        </span>
                      )}
                      {n.metadata?.discord_dm_sent === 'blocked' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-status-danger-text">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                          DM 차단됨
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PageContainer>
    </div>
  )
}
