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
import { CHANNEL_BRANDS } from './channel-brand'

interface Props {
  bundleId: string
  canApprove: boolean
}

// 채널 라벨은 CHANNEL_BRANDS에서 조회 (중앙화)
// 하위 호환 위해 로컬 alias만 유지
const CHANNEL_LABELS: Record<ChannelFormat, string> = {
  discord_forum_markdown: CHANNEL_BRANDS.discord_forum_markdown.label,
  instagram_caption: CHANNEL_BRANDS.instagram_caption.label,
  linkedin_post: CHANNEL_BRANDS.linkedin_post.label,
  everytime_post: CHANNEL_BRANDS.everytime_post.label,
  email_newsletter: CHANNEL_BRANDS.email_newsletter.label,
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
      <div className="flex flex-wrap items-center gap-2 mb-2">
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
      <p className="text-xs text-txt-tertiary mb-5 leading-relaxed">
        AI가 페르소나를 참고해 <strong className="text-txt-secondary font-semibold">{channels.length}개 채널</strong>용 초안을 준비했습니다. 아래 탭을 눌러 각 채널의 미리보기를 확인하시고, 괜찮으면 우측에서 승인해 주십시오.
      </p>

      {/* 2-column grid: 메인(출력) + 사이드바(메타·액션) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* MAIN — 출력 미리보기 */}
        <div className="lg:col-span-2 space-y-3">
          {channels.length > 0 ? (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {channels.map((fmt) => {
                  const brand = CHANNEL_BRANDS[fmt]
                  const Icon = brand?.icon
                  const isActive = current === fmt
                  return (
                    <button
                      key={fmt}
                      onClick={() => setActiveTab(fmt)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? `${brand?.activeClass ?? 'bg-brand text-white'} shadow-sm`
                          : `bg-surface-card text-txt-secondary border border-border ${brand?.inactiveHoverClass ?? 'hover:text-txt-primary'} hover:bg-surface-bg`
                      }`}
                    >
                      {Icon && <Icon size={14} />}
                      {brand?.label ?? CHANNEL_LABELS[fmt]}
                    </button>
                  )
                })}
              </div>

              {current && outputsByFormat.get(current) && (
                <OutputPanel output={outputsByFormat.get(current)!} />
              )}
            </>
          ) : (
            <section className="bg-surface-card border border-border rounded-2xl p-8 text-center">
              <p className="text-sm text-txt-primary font-semibold mb-1">
                준비된 초안이 아직 없습니다
              </p>
              <p className="text-xs text-txt-tertiary leading-relaxed">
                AI가 채널별 초안을 만드는 데 실패했을 수 있습니다.
                <br />
                잠시 후 다시 시도하시거나, 페르소나 슬롯이 충분히 채워졌는지 확인해 주십시오.
              </p>
            </section>
          )}
        </div>

        {/* SIDEBAR — 메타데이터 + 승인 액션 */}
        <aside className="space-y-3">
          {/* 메타데이터 */}
          <section className="bg-surface-card border border-border rounded-2xl p-4">
            <h3 className="text-xs font-bold text-txt-primary mb-0.5">
              이번 발행은 어떤 상황인가요?
            </h3>
            <p className="text-[10px] text-txt-tertiary mb-3">
              AI가 글을 쓸 때 참고한 정보입니다
            </p>
            <MetadataSummary metadata={bundle.event_metadata} />
          </section>

          {/* 승인/거절 */}
          {canApprove && bundle.status === 'pending_approval' && (
            <section className="bg-surface-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-txt-primary mb-1">
                이대로 괜찮으신가요?
              </h3>
              <p className="text-xs text-txt-tertiary mb-3 leading-relaxed">
                승인하시면 <strong className="text-txt-secondary">Discord 포럼</strong>에는 바로 올라가고, 인스타·링크드인·에타 같은 채널은 탭에서 복사하셔서 올리시면 됩니다.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
                >
                  <Check size={14} />
                  {approve.isPending ? '승인 중...' : '네, 이대로 올릴게요'}
                </button>
                <button
                  onClick={() => setRejectOpen(true)}
                  disabled={approve.isPending}
                  className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-border text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
                >
                  <XIcon size={14} />
                  다시 쓸게요
                </button>
              </div>
              <p className="text-[10px] text-txt-tertiary mt-3 leading-relaxed">
                💡 "다시 쓸게요"를 누르시면 어떤 점이 아쉬웠는지 적으실 수 있어요. AI가 그걸 기억해서 다음부터 안 만들도록 학습합니다.
              </p>
            </section>
          )}

          {bundle.status === 'rejected' && bundle.rejected_reason && (
            <section className="bg-surface-card border border-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-txt-primary mb-1">
                어떤 점이 아쉬우셨나요
              </h3>
              <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap">
                {bundle.rejected_reason}
              </p>
              <p className="text-xs text-txt-tertiary mt-2 leading-relaxed">
                이 내용은 페르소나의 "절대 금기" 항목에 자동으로 추가되어, 다음 AI 글쓰기에 반영됩니다.
              </p>
            </section>
          )}
        </aside>
      </div>

      {/* 거절(다시 쓰기) 모달 */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-surface-card rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-txt-primary mb-1">
              어떤 점이 아쉬우셨나요?
            </h3>
            <p className="text-xs text-txt-tertiary mb-4 leading-relaxed">
              구체적으로 적어주시면 AI가 <strong className="text-txt-secondary">다음부터 같은 실수</strong>를 하지 않도록 학습합니다. 한 줄이어도 괜찮습니다.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              placeholder={`예1) 너무 홍보 느낌이 강합니다. "우리만의 특별한" 같은 표현 자제해 주세요.\n예2) 이번 주 MVP 성과는 언급하지 않았습니다. 수치 포함해서 다시 써주세요.`}
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
                닫기
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.error('어떤 점이 아쉬웠는지 한 줄이라도 적어주세요')
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
                {reject.isPending ? '보내는 중...' : 'AI에게 알려주기'}
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
  const brand = fmt ? CHANNEL_BRANDS[fmt] : null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output.generated_content)
      toast.success(
        brand
          ? `${brand.label}에 붙여넣으세요. 클립보드에 복사됐습니다`
          : '클립보드에 복사됐습니다',
      )
    } catch {
      toast.error('복사에 실패했습니다. 브라우저 권한을 확인해 주세요')
    }
  }

  return (
    <div className="space-y-3">
      {/* 채널 안내 — 이 탭이 뭐고 뭘 해야 하는지 */}
      {brand && (
        <div className="bg-surface-bg border border-border rounded-xl px-4 py-2.5">
          <p className="text-xs text-txt-secondary leading-relaxed">
            {brand.description}
          </p>
        </div>
      )}

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
            <span className="inline-flex items-center gap-1 text-[11px] text-status-success-text">
              <Send size={11} />
              이미 올라갔어요
            </span>
          )}
          {constraints && renderConstraints(constraints)}
        </div>
        {isCopyOnly && brand ? (
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 shrink-0 ${brand.accent}`}
          >
            <Copy size={12} />
            {brand.action_verb}
          </button>
        ) : (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border text-xs font-semibold text-txt-primary hover:bg-surface-bg transition-colors shrink-0"
          >
            <Copy size={12} />
            복사
          </button>
        )}
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
