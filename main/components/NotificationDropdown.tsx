'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PrefetchLink as Link } from '@/components/ui/PrefetchLink'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/src/context/AuthContext'
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
  X,
  UserPlus,
} from 'lucide-react'
import { timeAgo } from '@/src/lib/utils'

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
  project_update: { icon: FileText, color: 'text-brand bg-brand-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  recommendation: { icon: Check, color: 'text-status-info-text bg-status-info-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
  new_match: { icon: Check, color: 'text-indicator-online bg-status-success-bg', readColor: 'text-txt-disabled bg-surface-sunken' },
}

const defaultConfig = { icon: Bell, color: 'text-txt-secondary bg-surface-sunken', readColor: 'text-txt-disabled bg-surface-sunken' }

export function NotificationDropdown() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Reset tab when closing
  useEffect(() => {
    if (!isOpen) setShowAll(false)
  }, [isOpen])

  // Fetch all notifications (we filter client-side for instant UI)
  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=30')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !isAuthLoading && !!user,
    refetchInterval: isOpen ? 15_000 : 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10_000,
  })

  // Mark single as read
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
      // Optimistic update — immediately move to read
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications'])
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...prev,
          unread_count: Math.max(0, prev.unread_count - 1),
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, status: 'read' as const, read_at: new Date().toISOString() } : n
          ),
        })
      }
      return { prev }
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(['notifications'], context.prev)
      toast.error('알림 읽음 처리에 실패했습니다')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Mark all as read
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
      const prev = queryClient.getQueryData<NotificationsResponse>(['notifications'])
      if (prev) {
        queryClient.setQueryData<NotificationsResponse>(['notifications'], {
          ...prev,
          unread_count: 0,
          notifications: prev.notifications.map((n) => ({
            ...n,
            status: 'read' as const,
            read_at: n.read_at || new Date().toISOString(),
          })),
        })
      }
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['notifications'], context.prev)
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
    setIsOpen(false)
  }, [markReadMutation, router])

  const allNotifications = data?.notifications ?? []
  const unreadCount = data?.unread_count ?? 0
  const unreadNotifications = allNotifications.filter((n) => n.status === 'unread')
  const readNotifications = allNotifications.filter((n) => n.status === 'read')

  // What to display based on tab
  const displayList = showAll ? allNotifications : unreadNotifications

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="알림"
        aria-expanded={isOpen}
        className="relative w-10 h-10 flex items-center justify-center text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken rounded-xl transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-indicator-alert text-white text-[10px] font-bold rounded-full leading-none animate-in zoom-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-[24rem] bg-surface-card border border-border rounded-2xl shadow-xl z-popover animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-3.5 pb-2.5 border-b border-border/40">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-sm text-txt-primary">알림</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[11px] text-txt-tertiary hover:text-brand transition-colors flex items-center gap-1 font-medium"
                  >
                    {markAllReadMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CheckCheck size={12} />
                    )}
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-txt-tertiary hover:text-txt-primary transition-colors rounded-lg hover:bg-surface-sunken p-1"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            {/* Tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setShowAll(false)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  !showAll
                    ? 'bg-surface-inverse text-txt-inverse'
                    : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken'
                }`}
              >
                새 알림{unreadCount > 0 && ` (${unreadCount})`}
              </button>
              <button
                onClick={() => setShowAll(true)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                  showAll
                    ? 'bg-surface-inverse text-txt-inverse'
                    : 'text-txt-tertiary hover:text-txt-primary hover:bg-surface-sunken'
                }`}
              >
                전체 내역
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[24rem] overflow-y-auto">
            {displayList.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={28} className="mx-auto text-txt-disabled mb-2" />
                <p className="text-xs text-txt-tertiary">
                  {showAll ? '알림 내역이 없습니다' : '새로운 알림이 없습니다'}
                </p>
                {!showAll && readNotifications.length > 0 && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="text-[11px] text-brand hover:text-brand-hover mt-2 font-medium"
                  >
                    이전 알림 보기 ({readNotifications.length})
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
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border/30 last:border-b-0 ${
                      isUnread
                        ? 'hover:bg-surface-sunken'
                        : 'opacity-50 hover:opacity-70'
                    }`}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 rounded-lg ${
                      isUnread ? config.color : config.readColor
                    }`}>
                      {/* @ts-expect-error lucide icon size prop */}
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs line-clamp-1 ${
                          isUnread
                            ? 'font-semibold text-txt-primary'
                            : 'text-txt-disabled line-through decoration-gray-300'
                        }`}>
                          {n.title}
                        </p>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 bg-brand rounded-full shrink-0" />
                        )}
                      </div>
                      <p className={`text-[11px] line-clamp-2 mt-0.5 leading-relaxed ${
                        isUnread ? 'text-txt-tertiary' : 'text-txt-disabled'
                      }`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-txt-disabled mt-1 font-mono">
                        {timeAgo(n.created_at)}
                        {!isUnread && ' · 확인됨'}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div className="border-t border-border/40 px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center text-[11px] font-bold text-txt-tertiary hover:text-brand transition-colors py-1"
              >
                전체 알림 페이지 →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
