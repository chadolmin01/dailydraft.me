'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import { EVENT_CONFIG } from '@/src/lib/personas/event-catalog'
import type {
  ChannelFormat,
  EventType,
  PersonaOutputBundleRow,
} from '@/src/lib/personas/types'
import { CHANNEL_BRANDS } from './channel-brand'

interface Props {
  slug: string
  embedded?: boolean
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'published' | 'rejected'

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '승인 대기' },
  { key: 'approved', label: '승인됨' },
  { key: 'published', label: '발행됨' },
  { key: 'rejected', label: '거절됨' },
]

export function DeckListShell({ slug, embedded = false }: Props) {
  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona

  const { data: bundlesData, isLoading } = useQuery({
    queryKey: ['persona-bundles', persona?.id],
    enabled: !!persona?.id,
    staleTime: 1000 * 30,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<{ bundles: PersonaOutputBundleRow[] }> => {
      const res = await fetch(
        `/api/personas/${persona!.id}/bundles?limit=50`,
      )
      if (!res.ok) throw new Error('덱 목록을 불러오지 못했습니다')
      return res.json()
    },
  })

  const [filter, setFilter] = useState<StatusFilter>('all')

  const bundles = bundlesData?.bundles ?? []
  const filtered = useMemo(() => {
    if (filter === 'all') return bundles
    return bundles.filter((b) => mapStatus(b.status) === filter)
  }, [bundles, filter])

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: bundles.length,
      pending: 0,
      approved: 0,
      published: 0,
      rejected: 0,
    }
    for (const b of bundles) {
      const k = mapStatus(b.status)
      if (k !== 'all') c[k]++
    }
    return c
  }, [bundles])

  return (
    <>
      {!embedded && (
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/clubs/${slug}`}
              className="text-txt-tertiary hover:text-txt-primary transition-colors shrink-0"
              aria-label="뒤로"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-txt-primary">내 덱 모음</h1>
              <p className="text-xs text-txt-tertiary leading-relaxed">
                {club?.name ?? '우리 동아리'}에서 AI가 만든 글들. 승인·발행 상태로 한눈에 관리하십시오.
              </p>
            </div>
          </div>
          <Link
            href={`/clubs/${slug}/bundles/new`}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors shrink-0"
          >
            <Plus size={14} />새 덱
          </Link>
        </div>
      )}

      {/* 필터 스트립 */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mt-4 mb-4">
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.key
          const count = counts[f.key]
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? 'bg-txt-primary text-surface-card'
                  : 'bg-surface-card text-txt-secondary border border-border hover:bg-surface-bg'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`text-[10px] px-1 py-0 rounded ${
                    active
                      ? 'bg-surface-card/20 text-surface-card'
                      : 'bg-surface-bg text-txt-tertiary'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="h-44 rounded-2xl skeleton-shimmer" />
          <div className="h-44 rounded-2xl skeleton-shimmer" />
        </div>
      ) : !persona ? (
        <EmptyBlock
          title="페르소나가 먼저 필요합니다"
          hint="덱을 만들려면 동아리의 '말투'를 먼저 정해두셔야 해요."
          cta={{ label: '페르소나 설정하러 가기', href: `/clubs/${slug}/settings/persona` }}
        />
      ) : filtered.length === 0 ? (
        <EmptyBlock
          title={
            filter === 'all' ? '아직 만든 덱이 없어요' : '이 상태의 덱이 없어요'
          }
          hint={
            filter === 'all'
              ? 'AI에게 공지·주간업데이트·모집·쇼케이스 등 글을 부탁해 보세요.'
              : '다른 필터를 선택하거나 새 덱을 만드십시오.'
          }
          cta={{ label: '+ 새 덱 만들기', href: `/clubs/${slug}/bundles/new` }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((b) => (
            <DeckCard key={b.id} bundle={b} slug={slug} />
          ))}
        </div>
      )}
    </>
  )
}

// ============================================================
// Card
// ============================================================
function DeckCard({
  bundle,
  slug,
}: {
  bundle: PersonaOutputBundleRow
  slug: string
}) {
  const config = EVENT_CONFIG[bundle.event_type as EventType]
  const label = config?.label ?? bundle.event_type
  const channels = config?.channels ?? []
  const status = mapStatus(bundle.status)
  const statusInfo = STATUS_INFO[status]
  const StatusIcon = statusInfo.icon

  const title =
    ((bundle.event_metadata as Record<string, unknown>)?.title as string) ||
    ((bundle.event_metadata as Record<string, unknown>)?.cohort as string) ||
    null

  return (
    <Link
      href={`/clubs/${slug}/bundles/${bundle.id}`}
      className="group bg-surface-card border border-border rounded-2xl p-4 hover:border-brand-border hover:shadow-sm transition-all flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-brand">{label}</span>
            {bundle.week_number && (
              <span className="text-[10px] text-txt-tertiary">
                {bundle.week_number}주차
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-txt-primary line-clamp-2 leading-snug min-h-[2.5rem]">
            {title ?? `${label} 덱`}
          </h3>
        </div>
        <div
          className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${statusInfo.cls}`}
        >
          <StatusIcon size={10} />
          {statusInfo.label}
        </div>
      </div>

      {/* 채널 배지 */}
      <div className="flex flex-wrap gap-1">
        {channels.map((ch) => {
          const brand = CHANNEL_BRANDS[ch as ChannelFormat]
          const Icon = brand?.icon
          return (
            <span
              key={ch}
              className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${brand?.bg ?? 'bg-surface-bg'} ${brand?.text ?? 'text-txt-tertiary'}`}
            >
              {Icon && <Icon size={10} />}
              {brand?.label ?? ch}
            </span>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-txt-tertiary mt-auto pt-2 border-t border-border">
        <span>{formatRelative(bundle.created_at)}</span>
        <span className="inline-flex items-center gap-0.5 text-brand font-semibold group-hover:gap-1 transition-all">
          열기
          <ChevronRight size={10} />
        </span>
      </div>
    </Link>
  )
}

function EmptyBlock({
  title,
  hint,
  cta,
}: {
  title: string
  hint: string
  cta?: { label: string; href: string }
}) {
  return (
    <div className="bg-surface-card border border-dashed border-border rounded-2xl p-10 text-center">
      <div className="w-11 h-11 mx-auto rounded-2xl bg-surface-bg flex items-center justify-center mb-3">
        <Sparkles size={18} className="text-txt-tertiary" />
      </div>
      <p className="text-sm font-bold text-txt-primary mb-1">{title}</p>
      <p className="text-xs text-txt-tertiary leading-relaxed mb-5 max-w-sm mx-auto">
        {hint}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================
function mapStatus(s: string): StatusFilter {
  if (s === 'pending_approval' || s === 'generating') return 'pending'
  if (s === 'approved') return 'approved'
  if (s === 'published') return 'published'
  if (s === 'rejected' || s === 'archived') return 'rejected'
  return 'all'
}

const STATUS_INFO: Record<
  StatusFilter,
  { label: string; icon: typeof FileText; cls: string }
> = {
  all: { label: '', icon: FileText, cls: 'bg-surface-bg text-txt-tertiary' },
  pending: {
    label: '승인 대기',
    icon: Clock,
    cls: 'bg-brand-bg text-brand',
  },
  approved: {
    label: '승인됨',
    icon: CheckCircle2,
    cls: 'bg-green-500/10 text-green-600',
  },
  published: {
    label: '발행됨',
    icon: CheckCircle2,
    cls: 'bg-green-500/10 text-green-600',
  },
  rejected: {
    label: '거절',
    icon: XCircle,
    cls: 'bg-status-danger-text/10 text-status-danger-text',
  },
}

function formatRelative(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}
