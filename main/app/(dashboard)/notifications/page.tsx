'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()
  const [showAll, setShowAll] = useState(false)

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', 'full'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=50')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !isAuthLoading && !!user,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
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
  const displayList = showAll ? allNotifications : unreadNotifications

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="standard" className="py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[0.625rem] font-medium text-txt-tertiary mb-1 flex items-center gap-2">
              <Bell size={12} /> NOTIFICATIONS
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

        {/* Notification List */}
        <div className="bg-surface-card rounded-xl border border-border shadow-md">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-txt-disabled" />
            </div>
          ) : displayList.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={32} className="mx-auto text-txt-disabled mb-3" />
              <p className="text-sm text-txt-tertiary">
                {showAll ? '알림 내역이 없습니다' : '새로운 알림이 없습니다'}
              </p>
              {!showAll && allNotifications.length > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs text-txt-tertiary hover:text-txt-primary mt-3 underline underline-offset-2"
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
                  className={`w-full flex items-start gap-4 px-5 py-4 text-left transition-colors border-b border-border-subtle last:border-b-0 ${
                    isUnread
                      ? 'hover:bg-surface-sunken'
                      : 'opacity-50 hover:opacity-70'
                  }`}
                >
                  <div className={`w-10 h-10 flex items-center justify-center shrink-0 mt-0.5 ${
                    isUnread ? config.color : config.readColor
                  }`}>
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
                    <p className="text-[10px] text-txt-disabled mt-1.5 font-mono">
                      {timeAgo(n.created_at)}
                      {!isUnread && ' · 확인됨'}
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
