'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useBundleDetail } from '@/src/hooks/useBundles'
import { CHANNEL_BRANDS } from '@/components/bundles/channel-brand'
import { EVENT_CONFIG } from '@/src/lib/personas/event-catalog'
import type { ChannelFormat, EventType } from '@/src/lib/personas/types'
import type { EventDef, MetaField, Step } from './_types'
import { EVENTS, META_FIELDS } from './_types'

// NewBundleShell step 컴포넌트 모음.
// 5 step (PickEvent, FillMeta, Generating, Schedule, Error) + StepIndicator + MobilePreview
// + presets/format util. 메인 NewBundleShell.tsx 와 props 로 통신.

// ──────────────────────────────────────────────
// StepIndicator — 진행도 표시
// ──────────────────────────────────────────────
export function StepIndicator({
  step,
  scheduleMode,
}: {
  step: Step
  scheduleMode: boolean
}) {
  const steps: Array<{ key: Step[]; label: string }> = scheduleMode
    ? [
        { key: ['pick-event'], label: '1. 어떤 글?' },
        { key: ['fill-meta', 'generating', 'error'], label: '2. 정보 입력' },
        { key: ['generating'], label: '3. AI 작성' },
        { key: ['schedule'], label: '4. 언제 올릴지' },
      ]
    : [
        { key: ['pick-event'], label: '1. 어떤 글?' },
        { key: ['fill-meta', 'generating', 'error'], label: '2. 정보 입력' },
        { key: ['generating'], label: '3. AI 작성' },
      ]

  return (
    <div className="flex items-center gap-2 mb-6 mt-1">
      {steps.map((s, i) => {
        const active = s.key.includes(step)
        const done = steps.slice(0, i).some((prev) => prev.key.includes(step))
        return (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                active
                  ? 'bg-brand text-white font-semibold'
                  : done
                  ? 'bg-brand-bg text-brand'
                  : 'bg-surface-bg text-txt-tertiary'
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <ChevronRight size={12} className="text-txt-tertiary" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 1: Pick event — 4종 이벤트 카드 그리드
// ──────────────────────────────────────────────
export function PickEventStep({ onPick }: { onPick: (ev: EventType) => void }) {
  return (
    <div>
      <p className="text-xs text-txt-tertiary mb-3">
        아래 중 하나를 고르시면 AI가 각 채널에 맞는 글을 5종으로 준비합니다.
      </p>
      <div className="grid md:grid-cols-3 gap-3">
        {EVENTS.map((ev) => {
          const Icon = ev.icon
          const channels = EVENT_CONFIG[ev.key]?.channels ?? []
          return (
            <button
              key={ev.key}
              onClick={() => onPick(ev.key)}
              className="text-left bg-surface-card border border-border rounded-2xl p-5 hover:border-brand-border hover:bg-brand-bg/40 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center">
                  <Icon size={18} className="text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-txt-primary">{ev.label}</h3>
                  <p className="text-[11px] text-txt-tertiary">{ev.tagline}</p>
                </div>
              </div>
              <p className="text-xs text-txt-secondary leading-relaxed mb-3">{ev.useCase}</p>
              <p className="text-[11px] text-txt-tertiary italic mb-3 leading-relaxed">
                {ev.example}
              </p>

              {/* 채널 배지 */}
              <div className="flex flex-wrap items-center gap-1 mb-2">
                {channels.map((ch) => {
                  const brand = CHANNEL_BRANDS[ch as ChannelFormat]
                  return (
                    <span
                      key={ch}
                      className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${brand?.bg} ${brand?.text}`}
                    >
                      {brand?.label}
                    </span>
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-txt-tertiary">⏰ {ev.timeline}</span>
                <span className="inline-flex items-center gap-0.5 text-brand font-semibold group-hover:gap-1 transition-all">
                  선택
                  <ChevronRight size={10} />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 2: Fill meta — 이벤트별 메타 폼
// ──────────────────────────────────────────────
export function FillMetaStep({
  def,
  meta,
  onChange,
  onBack,
  onSubmit,
  canSubmit,
}: {
  def: EventDef
  meta: Record<string, string>
  onChange: (next: Record<string, string>) => void
  onBack: () => void
  onSubmit: () => void
  canSubmit: boolean
}) {
  const fields: MetaField[] = META_FIELDS[def.key] ?? []
  const valid = fields.filter((f) => f.required).every((f) => !!meta[f.name]?.trim())

  return (
    <div className="max-w-2xl">
      <div className="bg-surface-card border border-border rounded-2xl p-5 mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center">
            <def.icon size={18} className="text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-txt-primary">{def.label}</h3>
            <p className="text-[11px] text-txt-tertiary">{def.tagline}</p>
          </div>
        </div>

        <p className="text-xs text-txt-secondary leading-relaxed mb-5">
          아래 정보를 채워주시면 AI가 그에 맞춰 글을 씁니다. 비워두신 항목은 페르소나와 일반 맥락으로 AI가 채웁니다.
        </p>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-semibold text-txt-primary mb-1">
                {f.label}
                {f.required && <span className="text-status-danger-text ml-1">*</span>}
                {!f.required && (
                  <span className="text-[11px] text-txt-tertiary ml-1 font-normal">(선택)</span>
                )}
              </label>
              {f.hint && (
                <p className="text-[11px] text-txt-tertiary mb-1.5 leading-relaxed">
                  💡 {f.hint}
                </p>
              )}
              {f.type === 'textarea' ? (
                <textarea
                  value={meta[f.name] ?? ''}
                  onChange={(e) => onChange({ ...meta, [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2 ob-input leading-relaxed resize-none"
                />
              ) : f.type === 'select' ? (
                <select
                  value={meta[f.name] ?? ''}
                  onChange={(e) => onChange({ ...meta, [f.name]: e.target.value })}
                  className="w-full h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 ob-input"
                >
                  <option value="">선택하세요...</option>
                  {(f.options ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type}
                  value={meta[f.name] ?? ''}
                  onChange={(e) => onChange({ ...meta, [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 ob-input"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-border text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors"
        >
          <ArrowLeft size={14} />
          이전 단계
        </button>
        <button
          onClick={onSubmit}
          disabled={!valid || !canSubmit}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
        >
          <Sparkles size={14} />
          AI에게 부탁하기
        </button>
      </div>

      {!canSubmit && (
        <p className="text-[11px] text-txt-tertiary mt-3 text-right">
          대표/운영진만 글 생성이 가능합니다
        </p>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 3: Generating — AI 작성 대기 화면
// ──────────────────────────────────────────────
export function GeneratingStep({ def }: { def: EventDef }) {
  return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="inline-flex items-center gap-2 text-base font-bold text-txt-primary mb-3">
        <Loader2 size={20} className="animate-spin text-brand" />
        AI 가 글을 쓰고 있습니다
      </div>
      <p className="text-sm text-txt-secondary leading-relaxed mb-1">
        {def.label} 글을 여러 채널에 맞춰 준비 중입니다.
      </p>
      <p className="text-xs text-txt-tertiary leading-relaxed">
        보통 20~60초 걸립니다. 완료되면 자동으로 미리보기 화면으로 이동합니다.
      </p>
    </div>
  )
}

// ──────────────────────────────────────────────
// Step 4 (예약 모드): 발행 시간 선택 + 모바일 프리뷰 + 3버튼
// mirra 020559 패턴 — 좌 폼, 우 플랫폼 프리뷰.
// ──────────────────────────────────────────────
export function ScheduleStep({
  def,
  bundleId,
  slug,
  isScheduling,
  isPublishingNow,
  onSchedule,
  onPublishNow,
  onSaveDraft,
}: {
  def: EventDef
  bundleId: string
  slug: string
  isScheduling: boolean
  isPublishingNow: boolean
  onSchedule: (iso: string) => void
  onPublishNow: () => void
  onSaveDraft: () => void
}) {
  const [value, setValue] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    return toLocalInputValue(d)
  })
  const { data: bundleData } = useBundleDetail(bundleId)
  const outputs = bundleData?.outputs ?? []

  // 프리뷰 탭 — 기본은 첫 번째 output, 우선순위는 linkedin_post → discord → 나머지
  const previewFormats = useMemo(() => {
    const order: ChannelFormat[] = [
      'linkedin_post',
      'discord_forum_markdown',
      'instagram_caption',
      'everytime_post',
      'email_newsletter',
    ]
    return outputs
      .map((o) => o.channel_format as ChannelFormat)
      .filter((f): f is ChannelFormat => !!f)
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }, [outputs])

  const [activePreview, setActivePreview] = useState<ChannelFormat | null>(null)
  const currentPreview = activePreview ?? previewFormats[0] ?? null
  const currentOutput = useMemo(
    () => outputs.find((o) => o.channel_format === currentPreview),
    [outputs, currentPreview]
  )

  const presets = usePresets()

  const handleScheduleClick = () => {
    if (!value) {
      toast.error('발행 일시를 선택해 주세요', {
        description: '날짜와 시간을 모두 지정하시면 해당 시점에 자동 발행됩니다.',
      })
      return
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      toast.error('유효한 날짜 형식이 아닙니다', {
        description: '프리셋 버튼(오늘 저녁, 내일 아침 등)을 사용하시면 편리합니다.',
      })
      return
    }
    if (date.getTime() < Date.now() - 60_000) {
      toast.error('과거 시간으로는 예약하실 수 없습니다', {
        description:
          '지금 바로 발행하시려면 "바로 발행" 버튼을, 예약은 미래 시점만 지정해 주세요.',
      })
      return
    }
    onSchedule(date.toISOString())
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5 py-2">
      {/* LEFT — 폼 */}
      <section className="bg-surface-card border border-border rounded-2xl p-5 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
            <Clock size={18} className="text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-txt-primary mb-0.5">언제 올릴까요?</h2>
            <p className="text-xs text-txt-tertiary leading-relaxed">
              <strong className="text-txt-secondary">{def.label}</strong> 덱이 준비됐습니다. 지금 바로 올리시거나 원하는 시간에 자동 발행을 예약하십시오.
            </p>
          </div>
        </div>

        {/* 프리셋 */}
        <div>
          <p className="text-xs font-semibold text-txt-primary mb-2">빠른 선택</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setValue(toLocalInputValue(p.date))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-bg text-txt-secondary border border-border hover:bg-brand-bg hover:text-brand hover:border-brand-border transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-txt-tertiary mt-2 leading-relaxed">
            💡 한국 SNS는 오전 9시·오후 7시 참여율이 가장 높습니다.
          </p>
        </div>

        {/* 직접 입력 */}
        <label className="block">
          <span className="block text-xs font-semibold text-txt-primary mb-1.5">예약 시간</span>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-11 text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 ob-input"
          />
        </label>

        {/* 3버튼 — 예약 발행 / 지금 발행 / 임시저장 */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleScheduleClick}
              disabled={isScheduling || isPublishingNow}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
            >
              <Clock size={14} />
              {isScheduling ? '예약 중...' : '예약 발행'}
            </button>
            <button
              onClick={onPublishNow}
              disabled={isScheduling || isPublishingNow}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-border text-sm font-semibold text-txt-primary hover:bg-surface-bg transition-colors disabled:opacity-60"
            >
              <Sparkles size={14} />
              {isPublishingNow ? '발행 중...' : '지금 발행'}
            </button>
          </div>
          <button
            onClick={onSaveDraft}
            disabled={isScheduling || isPublishingNow}
            className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors disabled:opacity-60"
          >
            임시저장
          </button>
          <p className="text-[11px] text-txt-tertiary text-center leading-relaxed pt-1">
            <Link
              href={`/clubs/${slug}/bundles/${bundleId}`}
              className="underline underline-offset-2 hover:text-txt-primary transition-colors"
            >
              덱 상세에서 탭별 내용 확인
            </Link>{' '}
            후 결정하실 수도 있습니다
          </p>
        </div>
      </section>

      {/* RIGHT — 모바일 프리뷰 */}
      <aside className="space-y-3">
        {previewFormats.length > 1 && (
          <div className="flex gap-1 overflow-x-auto">
            {previewFormats.map((fmt) => {
              const brand = CHANNEL_BRANDS[fmt]
              const Icon = brand?.icon
              const active = currentPreview === fmt
              return (
                <button
                  key={fmt}
                  onClick={() => setActivePreview(fmt)}
                  className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                    active
                      ? `${brand?.activeClass ?? 'bg-brand text-white'}`
                      : 'bg-surface-card border border-border text-txt-secondary hover:bg-surface-bg'
                  }`}
                >
                  {Icon && <Icon size={11} />}
                  {brand?.label ?? fmt}
                </button>
              )
            })}
          </div>
        )}
        <MobilePreview
          format={currentPreview}
          content={currentOutput?.generated_content ?? ''}
        />
      </aside>
    </div>
  )
}

// ──────────────────────────────────────────────
// MobilePreview — 모바일 핸드셋 프레임 안에 플랫폼 게시물 미리보기
// ──────────────────────────────────────────────
function MobilePreview({
  format,
  content,
}: {
  format: ChannelFormat | null
  content: string
}) {
  if (!format || !content) {
    return (
      <div className="aspect-9/19 rounded-[2.5rem] bg-surface-bg border-2 border-border/60 flex items-center justify-center p-6">
        <p className="text-xs text-txt-tertiary text-center leading-relaxed">
          프리뷰를 준비하는 중입니다
        </p>
      </div>
    )
  }

  const brand = CHANNEL_BRANDS[format]
  const Icon = brand?.icon

  return (
    <div className="relative rounded-[2.5rem] bg-black p-2 shadow-xl">
      {/* 노치 */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-b-2xl z-10" />
      <div className="rounded-4xl bg-white overflow-hidden min-h-[520px]">
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
          {Icon && <Icon size={14} className="text-zinc-600" />}
          <span className="text-[11px] font-semibold text-zinc-800">
            {brand?.label ?? format}
          </span>
        </div>
        {/* 본문 */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-zinc-300" />
            <div>
              <p className="text-[11px] font-bold text-zinc-900">우리 동아리</p>
              <p className="text-[10px] text-zinc-500">방금 · 미리보기</p>
            </div>
          </div>
          <p className="text-[12px] text-zinc-800 whitespace-pre-wrap leading-relaxed wrap-break-word">
            {content.slice(0, 800)}
            {content.length > 800 && '…'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// usePresets — 발행 시간 빠른 선택 4종
// ──────────────────────────────────────────────
function usePresets(): Array<{ label: string; date: Date }> {
  const now = new Date()
  const makeAt = (daysAhead: number, hour: number) => {
    const d = new Date(now)
    d.setDate(now.getDate() + daysAhead)
    d.setHours(hour, 0, 0, 0)
    return d
  }
  const todayEvening = (() => {
    const d = new Date(now)
    d.setHours(19, 0, 0, 0)
    return d.getTime() > now.getTime() ? d : null
  })()

  const presets: Array<{ label: string; date: Date }> = []
  if (todayEvening) presets.push({ label: '오늘 저녁 7시', date: todayEvening })
  presets.push({ label: '내일 오전 9시', date: makeAt(1, 9) })
  presets.push({ label: '내일 저녁 7시', date: makeAt(1, 19) })
  // 다음 월요일 9시
  const daysToMonday = (8 - now.getDay()) % 7 || 7
  presets.push({ label: '다음 주 월요일 9시', date: makeAt(daysToMonday, 9) })
  return presets
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ──────────────────────────────────────────────
// Error step
// ──────────────────────────────────────────────
export function ErrorStep({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <p className="text-base font-bold text-txt-primary mb-2">글을 만들지 못했습니다</p>
      <p className="text-sm text-txt-secondary leading-relaxed mb-5">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
      >
        다시 시도
      </button>
    </div>
  )
}
