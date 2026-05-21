'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShieldCheck, Loader2, Clock, Check, X, ExternalLink,
  AlertCircle, Filter, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdmin } from '@/src/hooks/useAdmin'

/**
 * /admin/clubs-moderation — 클럽 공식 등록 신청 대기열
 *
 * platform admin 전용. 탭(pending/verified/rejected)으로 필터링.
 * 각 항목 클릭 시 증빙 상세 expandable, 승인/거부 버튼 제공.
 * 거부 시 사유 입력 모달.
 */

interface QueueItem {
  id: string
  slug: string
  name: string
  created_by: string
  created_at: string
  claim_status: 'pending' | 'verified' | 'rejected'
  university_id: string | null
  university: { name: string; short_name: string | null } | null
  creator: { nickname: string | null; avatar_url: string | null } | null
  verification_submitted_at: string | null
  verification_reviewed_at: string | null
  verification_note: string | null
  verification_documents: {
    representative_name?: string
    representative_email?: string
    founding_year?: number
    activity_summary?: string
    website_url?: string | null
    sns_url?: string | null
    charter_url?: string | null
  } | null
}

type StatusFilter = 'pending' | 'verified' | 'rejected' | 'all'

export default function ClubsModerationPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace('/')
    }
  }, [isAdmin, isAdminLoading, router])

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-clubs-moderation', statusFilter],
    enabled: !!isAdmin,
    queryFn: async () => {
      const qs = new URLSearchParams({ status: statusFilter }).toString()
      const res = await fetch(`/api/admin/clubs/moderation-queue?${qs}`)
      if (!res.ok) throw new Error((await res.json())?.error?.message ?? 'failed')
      return res.json() as Promise<{ data: { items: QueueItem[]; total: number } }>
    },
    staleTime: 1000 * 30,
  })

  const reviewMutation = useMutation({
    mutationFn: async (vars: { id: string; action: 'approve' | 'reject'; note?: string }) => {
      const res = await fetch(`/api/admin/clubs/${vars.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: vars.action, note: vars.note }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? '처리 실패')
      }
      return res.json()
    },
    onSuccess: (_, vars) => {
      toast.success(vars.action === 'approve' ? '승인되었습니다' : '거부되었습니다')
      setRejectingId(null)
      setRejectNote('')
      setExpandedId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-clubs-moderation'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={18} className="animate-spin text-txt-tertiary" />
      </div>
    )
  }

  if (!isAdmin) return null

  const items = data?.data?.items ?? []

  const TABS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'pending', label: '대기 중' },
    { value: 'verified', label: '승인됨' },
    { value: 'rejected', label: '거부됨' },
    { value: 'all', label: '전체' },
  ]

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-brand" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-txt-primary">클럽 인증 대기열</h1>
            <p className="text-[13px] text-txt-tertiary mt-0.5">
              공식 등록 신청을 검토하고 승인·거부합니다. 승인 시 학교 뱃지가 부여되고 공개 목록에 노출됩니다.
            </p>
          </div>
        </div>

        {/* Tab filter */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                statusFilter === t.value
                  ? 'bg-surface-inverse text-txt-inverse'
                  : 'bg-surface-card text-txt-secondary border border-border hover:border-txt-tertiary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-5 p-3 bg-status-danger-bg rounded-xl border border-status-danger-text/20 flex items-center gap-2 text-status-danger-text text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {(error as Error).message}
          </div>
        )}

        {isLoading && (
          <div className="py-24 text-center">
            <Loader2 size={20} className="animate-spin mx-auto text-txt-tertiary" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="py-20 text-center">
            <Filter size={24} className="mx-auto mb-3 text-txt-disabled" aria-hidden="true" />
            <p className="text-[13px] text-txt-tertiary">
              {statusFilter === 'pending' ? '대기 중인 신청이 없습니다' : '해당 상태의 클럽이 없습니다'}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {items.map(item => {
            const expanded = expandedId === item.id
            const doc = item.verification_documents
            return (
              <div
                key={item.id}
                className={`bg-surface-card border border-border rounded-2xl overflow-hidden transition-shadow ${
                  expanded ? 'shadow-md' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-surface-sunken transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.claim_status === 'pending' ? 'bg-status-warn-bg text-status-warn-text'
                      : item.claim_status === 'verified' ? 'bg-brand-bg text-brand'
                      : 'bg-status-danger-bg text-status-danger-text'
                  }`}>
                    {item.claim_status === 'pending' && <Clock size={14} />}
                    {item.claim_status === 'verified' && <Check size={14} strokeWidth={2.5} />}
                    {item.claim_status === 'rejected' && <X size={14} strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-bold text-txt-primary truncate">{item.name}</p>
                      {item.university && (
                        <span className="text-[11px] text-txt-tertiary shrink-0">
                          · {item.university.short_name ?? item.university.name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-txt-tertiary mt-0.5 truncate">
                      {item.creator?.nickname ?? '알 수 없음'}
                      {item.verification_submitted_at && (
                        <span> · {new Date(item.verification_submitted_at).toLocaleDateString('ko-KR')} 제출</span>
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-txt-tertiary shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-border-subtle space-y-4 text-[13px]">
                    <div className="grid grid-cols-2 gap-3">
                      <DetailRow label="대표자" value={doc?.representative_name} />
                      <DetailRow label="이메일" value={doc?.representative_email} mono />
                      <DetailRow label="창립 연도" value={doc?.founding_year?.toString()} mono />
                      <DetailRow
                        label="slug"
                        value={
                          <a href={`/clubs/${item.slug}`} target="_blank" rel="noopener" className="text-brand hover:underline inline-flex items-center gap-1">
                            /clubs/{item.slug} <ExternalLink size={10} />
                          </a>
                        }
                      />
                    </div>
                    {doc?.activity_summary && (
                      <div>
                        <p className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">활동 요약</p>
                        <p className="text-[12px] text-txt-primary leading-relaxed whitespace-pre-wrap">
                          {doc.activity_summary}
                        </p>
                      </div>
                    )}
                    {(doc?.website_url || doc?.sns_url || doc?.charter_url) && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">참고 링크</p>
                        {doc?.website_url && <LinkRow label="웹사이트" url={doc.website_url} />}
                        {doc?.sns_url && <LinkRow label="SNS" url={doc.sns_url} />}
                        {doc?.charter_url && <LinkRow label="회칙" url={doc.charter_url} />}
                      </div>
                    )}

                    {item.claim_status === 'rejected' && item.verification_note && (
                      <div className="p-3 bg-status-danger-bg rounded-xl">
                        <p className="text-[11px] font-semibold text-status-danger-text mb-1">거부 사유</p>
                        <p className="text-[12px] text-txt-primary">{item.verification_note}</p>
                      </div>
                    )}

                    {item.claim_status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: item.id, action: 'approve' })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand text-white rounded-xl text-[12px] font-bold hover:bg-brand-hover transition-colors disabled:opacity-50"
                        >
                          <Check size={13} strokeWidth={2.5} />
                          승인
                        </button>
                        <button
                          type="button"
                          onClick={() => { setRejectingId(item.id); setRejectNote('') }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-surface-card border border-status-danger-text/30 text-status-danger-text rounded-xl text-[12px] font-bold hover:bg-status-danger-bg transition-colors"
                        >
                          <X size={13} strokeWidth={2.5} />
                          거부
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 거부 사유 입력 모달 */}
        {rejectingId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRejectingId(null)}>
            <div
              className="bg-surface-card rounded-2xl shadow-xl max-w-md w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[15px] font-bold text-txt-primary mb-1">거부 사유 입력</h3>
              <p className="text-[12px] text-txt-tertiary mb-4 leading-relaxed">
                신청자에게 알림과 함께 전달됩니다. 구체적으로 작성해 주시면 재제출이 쉬워집니다.
              </p>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
                placeholder="예: 활동 요약이 일반적이라 학교 등록 동아리 여부를 확인할 수 없습니다. 정기 활동 사진이나 학교 공인 문서 링크를 추가해 주세요."
                className="w-full px-3 py-2.5 bg-surface-bg border border-border rounded-xl text-[13px] text-txt-primary placeholder:text-txt-disabled focus:outline-none focus:border-brand focus:shadow-[0_0_0_3px_rgba(94,106,210,0.12)] transition-all resize-none"
              />
              <div className="flex items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="flex-1 px-4 py-2.5 text-[13px] font-bold text-txt-secondary bg-surface-sunken hover:bg-surface-elevated rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={!rejectNote.trim() || reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({
                    id: rejectingId,
                    action: 'reject',
                    note: rejectNote.trim(),
                  })}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-status-danger-text text-white rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {reviewMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} strokeWidth={2.5} />}
                  거부 처리
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value?: string | React.ReactNode | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-[12px] text-txt-primary ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
    </div>
  )
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-brand hover:underline">
      <span className="text-txt-tertiary font-semibold">{label}:</span>
      <span className="font-mono truncate">{url}</span>
      <ExternalLink size={10} className="shrink-0" />
    </a>
  )
}
