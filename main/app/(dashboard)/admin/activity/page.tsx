'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import { Activity, ShieldX, Loader2, Filter } from 'lucide-react'

type ActivityItem = {
  id: string
  type: string
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  summary: string
  at: string
  meta?: Record<string, unknown>
}

type ApiResp = {
  items: ActivityItem[]
  profiles: Record<string, { nickname: string | null; avatar_url: string | null }>
  total: number
}

const TYPE_LABELS: Record<string, string> = {
  opportunity: '프로젝트',
  application: '지원',
  coffee_chat: '커피챗',
  invitation: '초대',
  dm: '쪽지',
  comment: '댓글',
  notification: '알림',
}

const TYPE_COLORS: Record<string, string> = {
  opportunity: 'bg-blue-100 text-blue-800',
  application: 'bg-purple-100 text-purple-800',
  coffee_chat: 'bg-amber-100 text-amber-800',
  invitation: 'bg-green-100 text-green-800',
  dm: 'bg-pink-100 text-pink-800',
  comment: 'bg-gray-100 text-gray-800',
  notification: 'bg-indigo-100 text-indigo-800',
}

function timeAgo(iso: string): string {
  if (!iso) return '-'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export default function AdminActivityPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) router.push('/explore')
  }, [isAdmin, isAdminLoading, router])

  const { data, isLoading, isError } = useQuery<ApiResp>({
    queryKey: ['admin-activity', typeFilter],
    queryFn: async () => {
      const qs = typeFilter ? `?type=${typeFilter}` : ''
      const res = await fetch(`/api/admin/activity${qs}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  })

  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <Loader2 className="animate-spin text-txt-tertiary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-bg">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">접근 권한이 없습니다</p>
      </div>
    )
  }

  const items = data?.items || []
  const profiles = data?.profiles || {}

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[62.5rem] mx-auto p-8 lg:p-12 space-y-6">
        <div className="border-b border-border pb-6">
          <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
            <Activity size={14} />
            Admin / Activity
          </div>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">활동 로그</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            서비스 전반의 최근 활동 ({items.length}건, 30초마다 갱신)
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-txt-tertiary" />
          <button
            onClick={() => setTypeFilter('')}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              typeFilter === '' ? 'bg-surface-inverse text-txt-inverse border-surface-inverse' : 'bg-surface-card border-border text-txt-secondary'
            }`}
          >
            전체
          </button>
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                typeFilter === key ? 'bg-surface-inverse text-txt-inverse border-surface-inverse' : 'bg-surface-card border-border text-txt-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
            ))}
          </div>
        ) : isError ? (
          <Card padding="p-8" className="text-center">
            <p className="text-txt-secondary">로그를 불러올 수 없습니다</p>
          </Card>
        ) : items.length === 0 ? (
          <Card padding="p-8" className="text-center">
            <p className="text-txt-secondary">표시할 활동이 없습니다</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const actor = item.actor_id ? profiles[item.actor_id] : null
              const target = item.target_type === 'user' && item.target_id ? profiles[item.target_id] : null
              return (
                <Card key={item.id} padding="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-800'}`}>
                      {TYPE_LABELS[item.type] || item.type}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-txt-primary">
                        {actor && (
                          <span className="font-semibold">{actor.nickname || '알 수 없음'}</span>
                        )}
                        {actor && target && <span className="text-txt-tertiary"> → </span>}
                        {target && (
                          <span className="font-semibold">{target.nickname || '알 수 없음'}</span>
                        )}
                        {(actor || target) && <span className="text-txt-tertiary"> · </span>}
                        <span className="text-txt-secondary">{item.summary}</span>
                      </div>
                      <div className="text-[11px] text-txt-tertiary mt-1 font-mono">
                        {timeAgo(item.at)} · {new Date(item.at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
