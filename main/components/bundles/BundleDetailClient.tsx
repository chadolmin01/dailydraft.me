'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, Send, X as XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { EVENT_CONFIG } from '@/src/lib/personas/event-catalog'
import type {
  ChannelFormat,
  EventType,
  PersonaOutputRow,
} from '@/src/lib/personas/types'
import {
  useApproveBundle,
  useBundleDetail,
  useRejectBundle,
} from '@/src/hooks/useBundles'
import { ChannelFrame } from './ChannelFrames'

interface Props {
  bundleId: string
  canApprove: boolean
}

const CHANNEL_LABELS: Record<ChannelFormat, string> = {
  discord_forum_markdown: 'Discord 포럼',
  instagram_caption: '인스타그램',
  linkedin_post: 'LinkedIn',
  everytime_post: '에브리타임',
  email_newsletter: '이메일 뉴스레터',
}

export function BundleDetailClient({ bundleId, canApprove }: Props) {
  const { data, isLoading, error } = useBundleDetail(bundleId)
  const approve = useApproveBundle(bundleId)
  const reject = useRejectBundle(bundleId)

  const [activeTab, setActiveTab] = useState<ChannelFormat | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const outputsByFormat = useMemo(() => {
    const map = new Map<ChannelFormat, PersonaOutputRow>()
    for (const o of data?.outputs ?? []) {
      if (o.channel_format) map.set(o.channel_format as ChannelFormat, o)
    }
    return map
  }, [data])

  const channels = useMemo(() => {
    if (!data?.bundle) return []
    return Array.from(outputsByFormat.keys())
  }, [data, outputsByFormat])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-surface-sunken rounded-2xl animate-pulse" />
        <div className="h-64 bg-surface-sunken rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface-card border border-border rounded-2xl p-5">
        <p className="text-sm text-txt-secondary">{error.message}</p>
      </div>
    )
  }

  if (!data?.bundle) return null

  const bundle = data.bundle
  const eventLabel = EVENT_CONFIG[bundle.event_type as EventType].label
  const current = activeTab ?? channels[0] ?? null

  const statusInfo = STATUS_INFO[bundle.status] ?? STATUS_INFO.generating

  return (
    <>
      {/* 한 줄 상태 스트립 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h2 className="text-base font-bold text-txt-primary">{eventLabel}</h2>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
        {bundle.week_number && (
          <span className="text-xs text-txt-tertiary">
            {bundle.week_number}주차
            {bundle.semester_ref ? ` · ${bundle.semester_ref}` : ''}
          </span>
        )}
      </div>

      {/* 2-column grid: 메인(출력) + 사이드바(메타·액션) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* MAIN — 출력 미리보기 */}
        <div className="lg:col-span-2 space-y-3">
          {channels.length > 0 ? (
            <>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {channels.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setActiveTab(fmt)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      current === fmt
                        ? 'bg-brand text-white'
                        : 'bg-surface-bg text-txt-secondary hover:bg-surface-sunken'
                    }`}
                  >
                    {CHANNEL_LABELS[fmt]}
                  </button>
                ))}
              </div>

              {current && outputsByFormat.get(current) && (
                <OutputPanel output={outputsByFormat.get(current)!} />
              )}
            </>
          ) : (
            <section className="bg-surface-card border border-border rounded-2xl p-8 text-center">
              <p className="text-sm text-txt-tertiary">
                생성된 채널 출력이 없습니다. 어댑터 실행이 모두 실패했을 수 있습니다.
              </p>
            </section>
          )}
        </div>

        {/* SIDEBAR — 메타데이터 + 승인 액션 */}
        <aside className="space-y-3">
          {/* 메타데이터 */}
          <section className="bg-surface-card border border-border rounded-2xl p-4">
            <h3 className="text-xs font-bold text-txt-primary mb-2">이벤트 정보</h3>
            <MetadataSummary metadata={bundle.event_metadata} />
          </section>

          {/* 승인/거절 */}
          {canApprove && bundle.status === 'pending_approval' && (
            <section className="bg-surface-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-txt-primary mb-1">최종 검토</h3>
              <p className="text-xs text-txt-tertiary mb-3 leading-relaxed">
                승인 시 자동 발행 가능 채널은 즉시 발행됩니다.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
                >
                  <Check size={14} />
                  {approve.isPending ? '승인 중...' : '승인하고 발행'}
                </button>
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={approve.isPending}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-border text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
                >
                  <XIcon size={14} />
                  거절
                </button>
              </div>
            </section>
          )}

          {bundle.status === 'rejected' && bundle.rejected_reason && (
            <section className="bg-surface-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-txt-primary mb-1">거절 사유</h3>
              <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap">
                {bundle.rejected_reason}
              </p>
              <p className="text-xs text-txt-tertiary mt-2">
                사유는 절대 금기 슬롯에 자동 반영됩니다
              </p>
            </section>
          )}
        </aside>
      </div>

      {/* 거절 모달 (인라인 폼) */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-surface-card rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-txt-primary mb-1">번들 거절</h3>
            <p className="text-xs text-txt-tertiary mb-4">
              거절 사유를 구체적으로 적어주십시오. AI가 다음부터 이 패턴을 피하도록 학습합니다.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              placeholder="예: 너무 홍보성 멘트가 많음. '우리만의 특별한' 같은 표현 자제."
              className="w-full text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand leading-relaxed resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setRejectOpen(false)
                  setRejectReason('')
                }}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.error('사유를 입력해주세요')
                    return
                  }
                  reject.mutate(rejectReason.trim(), {
                    onSuccess: () => {
                      setRejectOpen(false)
                      setRejectReason('')
                    },
                  })
                }}
                disabled={reject.isPending}
                className="h-9 px-4 rounded-lg bg-status-danger-text text-white text-sm font-semibold hover:bg-status-danger-text/90 transition-colors disabled:opacity-60"
              >
                {reject.isPending ? '거절 중...' : '거절'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function OutputPanel({ output }: { output: PersonaOutputRow }) {
  const isCopyOnly = output.is_copy_only
  const destination = output.destination
  const constraints = output.format_constraints as Record<string, unknown> | null
  const fmt = output.channel_format as ChannelFormat | null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output.generated_content)
      toast.success('클립보드에 복사됐습니다')
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <div className="space-y-3">
      {/* 플랫폼 프레임 */}
      {fmt ? (
        <ChannelFrame format={fmt} output={output} />
      ) : (
        <pre className="bg-surface-bg rounded-xl p-4 text-sm text-txt-primary whitespace-pre-wrap break-words leading-relaxed font-sans max-h-96 overflow-y-auto">
          {output.generated_content}
        </pre>
      )}

      {/* 액션 바 */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {!isCopyOnly && output.status === 'published' && destination && (
            <span className="inline-flex items-center gap-1 text-[11px] text-txt-secondary">
              <Send size={11} />
              발행됨
            </span>
          )}
          {constraints && renderConstraints(constraints)}
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-xs font-semibold text-txt-primary hover:bg-surface-bg transition-colors shrink-0"
        >
          <Copy size={12} />
          복사
        </button>
      </div>
    </div>
  )
}

function renderConstraints(c: Record<string, unknown>) {
  const items: string[] = []
  if (typeof c.char_used === 'number' && typeof c.char_limit === 'number') {
    items.push(`${c.char_used}/${c.char_limit}자`)
  }
  if (typeof c.title_used === 'number' && typeof c.title_limit === 'number') {
    items.push(`제목 ${c.title_used}/${c.title_limit}자`)
  }
  if (typeof c.body_used === 'number' && typeof c.body_limit === 'number') {
    items.push(`본문 ${c.body_used}/${c.body_limit}자`)
  }
  if (typeof c.hashtag_count === 'number') {
    items.push(`해시태그 ${c.hashtag_count}개`)
  }
  if (c.is_copy_only === true) {
    items.push('복사 전용')
  }
  return items.map((label, i) => (
    <span
      key={i}
      className="text-[10px] text-txt-tertiary px-1.5 py-0.5 rounded bg-surface-bg"
    >
      {label}
    </span>
  ))
}

function MetadataSummary({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata ?? {})
  if (entries.length === 0) {
    return (
      <p className="text-xs text-txt-tertiary">메타데이터 없음</p>
    )
  }
  return (
    <dl className="space-y-1.5">
      {entries.slice(0, 8).map(([k, v]) => (
        <div key={k} className="text-xs flex items-start gap-2">
          <dt className="text-txt-tertiary shrink-0">{k}</dt>
          <dd className="text-txt-primary min-w-0 break-words">
            {renderValue(v)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function renderValue(v: unknown): string {
  if (v === null || v === undefined) return '-'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `${v.length}개`
  return '…'
}

const STATUS_INFO: Record<
  string,
  { label: string; className: string }
> = {
  generating: { label: '생성 중', className: 'bg-surface-bg text-txt-tertiary' },
  pending_approval: {
    label: '승인 대기',
    className: 'bg-brand-bg text-brand',
  },
  approved: {
    label: '승인됨',
    className: 'bg-green-500/10 text-green-600',
  },
  published: {
    label: '발행됨',
    className: 'bg-green-500/10 text-green-600',
  },
  rejected: {
    label: '거절됨',
    className: 'bg-status-danger-text/10 text-status-danger-text',
  },
  archived: { label: '보관됨', className: 'bg-surface-bg text-txt-tertiary' },
}
