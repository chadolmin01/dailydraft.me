'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAdmin } from '@/src/hooks/useAdmin'
import { ShieldCheck, Filter, Loader2, User, Clock, Download } from 'lucide-react'

/**
 * 관리자 감사 로그 뷰 — audit_logs 테이블.
 *
 * 용도: 기관 실사·내부 조사·정보주체 열람 요청 대응.
 * 쓰기 경로: src/lib/audit.ts 의 writeAuditLog 에서 insert.
 * 이 페이지는 읽기 전용 (audit_logs 는 RLS 로 UPDATE/DELETE 전부 차단).
 */

interface AuditRow {
  id: string
  actor_user_id: string | null
  action: string
  target_type: string
  target_id: string | null
  diff: unknown
  context: unknown
  created_at: string
}

interface ApiResp {
  items: AuditRow[]
  actors: Record<string, { nickname: string | null; avatar_url: string | null }>
  total: number
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

const ACTION_PRESETS = [
  { label: '전체', value: '' },
  { label: 'Club', value: 'clubs.' },
  { label: 'Club 멤버', value: 'club_member.' },
  { label: 'Persona', value: 'personas.' },
  { label: 'Institution', value: 'institution_member.' },
  { label: 'Profile', value: 'profile.' },
]

export default function AdminAuditPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const [actionFilter, setActionFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) router.push('/explore')
  }, [isAdmin, isAdminLoading, router])

  const { data, isLoading, isError } = useQuery<ApiResp>({
    queryKey: ['admin-audit', actionFilter],
    queryFn: async () => {
      const qs = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : ''
      const res = await fetch(`/api/admin/audit${qs}`)
      if (!res.ok) throw new Error('Failed to load audit logs')
      return res.json()
    },
    enabled: isAdmin,
    // audit 은 잦게 갱신 필요 없음 — 60s
    refetchInterval: 60000,
  })

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-txt-tertiary" size={24} />
      </div>
    )
  }
  if (!isAdmin) return null

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
          <ShieldCheck size={14} />
          Admin / Audit Logs
        </div>
        <h1 className="text-3xl font-bold text-txt-primary tracking-tight">감사 로그</h1>
        <p className="text-txt-tertiary text-sm mt-1">
          운영·어드민·system 액션 append-only 로그 ({data?.items.length ?? 0}건)
          {actionFilter && (
            <>
              {' · 필터: '}
              <code className="px-1.5 py-0.5 bg-surface-sunken rounded text-txt-secondary font-mono">
                {actionFilter}
              </code>
            </>
          )}
        </p>
      </div>

      {/* Filter chips + CSV export */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-txt-tertiary" aria-hidden="true" />
        {ACTION_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => setActionFilter(p.value)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              actionFilter === p.value
                ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                : 'bg-surface-card border-border text-txt-secondary hover:border-txt-tertiary'
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* CSV 내보내기 — 현재 필터 유지. 최대 5,000 행, Excel 한글 BOM 포함 */}
        <a
          href={`/api/admin/audit/export${actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : ''}`}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border bg-surface-card text-txt-secondary hover:border-txt-tertiary hover:text-txt-primary transition-colors"
          download
          aria-label="감사 로그 CSV 내보내기"
          title="최대 10,000 행, 내보내기 자체도 역감사 기록"
        >
          <Download size={12} aria-hidden="true" />
          CSV 내보내기
        </a>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 skeleton-shimmer rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-status-danger-bg border border-status-danger-text/20 rounded-2xl p-6 text-center text-status-danger-text">
          감사 로그를 불러오지 못했습니다
        </div>
      ) : !data?.items.length ? (
        <div className="bg-surface-card border border-border rounded-2xl p-12 text-center">
          <ShieldCheck size={28} className="text-txt-disabled mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-txt-primary mb-1">기록된 로그가 없습니다</p>
          <p className="text-[13px] text-txt-tertiary">액션이 발생하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.items.map(item => {
            const actor = item.actor_user_id ? data.actors[item.actor_user_id] : null
            const isExpanded = expandedId === item.id
            const hasDetail = item.diff !== null || item.context !== null

            return (
              <li key={item.id}>
                <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => hasDetail && setExpandedId(isExpanded ? null : item.id)}
                    disabled={!hasDetail}
                    className={`w-full p-4 flex items-center gap-4 text-left ${hasDetail ? 'hover:bg-surface-sunken cursor-pointer' : 'cursor-default'}`}
                  >
                    {/* Actor */}
                    <div className="flex items-center gap-2 shrink-0 w-40">
                      <div className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center shrink-0">
                        <User size={12} className="text-txt-tertiary" />
                      </div>
                      <span className="text-[13px] font-medium text-txt-primary truncate">
                        {actor?.nickname ?? (item.actor_user_id ? '익명' : 'system')}
                      </span>
                    </div>

                    {/* Action */}
                    <code className="text-[12px] font-mono font-semibold text-brand bg-brand-bg px-2 py-1 rounded-md shrink-0">
                      {item.action}
                    </code>

                    {/* Target */}
                    <span className="text-[12px] text-txt-secondary flex-1 truncate">
                      {item.target_type}
                      {item.target_id && (
                        <code className="ml-1.5 text-[11px] text-txt-tertiary font-mono">
                          {item.target_id.slice(0, 8)}…
                        </code>
                      )}
                    </span>

                    {/* Time */}
                    <span className="text-[11px] text-txt-tertiary shrink-0 flex items-center gap-1">
                      <Clock size={11} />
                      {timeAgo(item.created_at)}
                    </span>
                  </button>

                  {isExpanded && hasDetail && (
                    <div className="border-t border-border bg-surface-sunken/50 px-4 py-3 space-y-3 text-[12px]">
                      {item.diff !== null && item.diff !== undefined ? (
                        <div>
                          <p className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">Diff</p>
                          <pre className="text-[11px] text-txt-secondary bg-surface-card p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all font-mono">
                            {JSON.stringify(item.diff, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                      {item.context !== null && item.context !== undefined ? (
                        <div>
                          <p className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">Context</p>
                          <pre className="text-[11px] text-txt-secondary bg-surface-card p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all font-mono">
                            {JSON.stringify(item.context, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* 법정 보존 안내 */}
      <p className="text-[11px] text-txt-tertiary text-center pt-6 border-t border-border-subtle">
        로그는 append-only 입니다 · RLS 로 UPDATE/DELETE 차단 · 보존 3년 (PIPA 법정 기준)
      </p>
    </div>
  )
}
