'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Megaphone,
  CalendarCheck,
  PartyPopper,
  Sparkles,
  ArrowLeft,
  Bell,
  Clock,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import {
  useApproveAndScheduleBundle,
  useApproveBundle,
  useBundleDetail,
} from '@/src/hooks/useBundles'
import { CHANNEL_BRANDS } from '@/components/bundles/channel-brand'
import { EVENT_CONFIG } from '@/src/lib/personas/event-catalog'
import type { ChannelFormat, EventType } from '@/src/lib/personas/types'

type Step = 'pick-event' | 'fill-meta' | 'generating' | 'schedule' | 'error'

interface EventDef {
  key: EventType
  icon: LucideIcon
  label: string
  tagline: string
  useCase: string
  example: string
  timeline: string
}

const EVENTS: EventDef[] = [
  {
    key: 'announcement',
    icon: Bell,
    label: '공지·안내',
    tagline: '가장 많이 쓰시는 범용 글',
    useCase:
      '모임 안내·이벤트 공지·스터디 모집·후기 등 어떤 주제든. 제목과 하고 싶은 말만 적어주시면 AI가 채널별로 다듬습니다.',
    example:
      '"다음 주 화요일 AI 툴 워크숍 합니다" / "해커톤 1위 후기 공유" 등',
    timeline: '매주 아무 때나',
  },
  {
    key: 'weekly_update',
    icon: CalendarCheck,
    label: '주간 업데이트',
    tagline: '이번 주 팀이 뭐 했는지',
    useCase:
      'Discord 대화를 AI가 읽고 "이번 주 우리 동아리 소식"으로 재구성합니다. 인스타 스토리·이메일 뉴스레터로 한 번에.',
    example:
      '"이번 주 MVP 팀 3곳이 사용자 인터뷰 완료했습니다" 같은 요약',
    timeline: '매주 일요일 자동 · 수동도 가능',
  },
  {
    key: 'recruit_open',
    icon: Megaphone,
    label: '신입 모집',
    tagline: '새 기수 모집 시즌',
    useCase:
      '모집 공고 글을 5채널에 맞게. 지원 링크와 마감일만 알려주시면 됩니다.',
    example:
      '"FLIP 10-1기 모집 시작! 4/25까지 지원해 주세요"',
    timeline: '학기 시작 3~4주차 · 연 2회',
  },
  {
    key: 'final_showcase',
    icon: PartyPopper,
    label: '학기말 쇼케이스',
    tagline: '결과 발표·자랑할 시간',
    useCase:
      '기수 마무리 데모데이 홍보 + 팀별 성과 정리를 5채널에 걸쳐 한 번에 준비합니다.',
    example:
      '"10-1기 12개 팀의 12주 여정, 이번 주 금요일 공개합니다"',
    timeline: '학기말 14~15주차',
  },
]

export function NewBundleShell({ slug }: { slug: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scheduleMode = searchParams.get('schedule') === '1'

  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  const [step, setStep] = useState<Step>('pick-event')
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [meta, setMeta] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdBundleId, setCreatedBundleId] = useState<string | null>(null)

  const approveAndSchedule = useApproveAndScheduleBundle(
    createdBundleId ?? undefined,
  )
  const approveNow = useApproveBundle(createdBundleId ?? undefined)

  const selectedDef = selectedEvent
    ? EVENTS.find((e) => e.key === selectedEvent) ?? null
    : null

  const handleGenerate = async () => {
    if (!persona || !selectedEvent) return
    setStep('generating')
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/personas/${persona.id}/bundles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: selectedEvent,
          event_metadata: toTypedMeta(selectedEvent, meta),
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error?.message ?? '번들 생성 실패')
      }
      const bundleId = body?.bundle?.id
      if (!bundleId) throw new Error('번들 ID를 받지 못했습니다')

      if (scheduleMode) {
        // 예약 모드: 덱 생성 후 바로 "언제 올릴지" 단계로 전환
        setCreatedBundleId(bundleId)
        toast.success('AI 가 글을 준비했습니다', {
          description: '발행 시간만 정해 주시면 예약되고, 그 시점에 자동으로 올라갑니다.',
        })
        setStep('schedule')
      } else {
        toast.success('AI 가 글을 모두 준비했습니다', {
          description: '각 채널별 초안을 확인하신 뒤 승인하시면 발행됩니다. 수정도 가능합니다.',
        })
        router.push(`/clubs/${slug}/bundles/${bundleId}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setErrorMessage(msg)
      setStep('error')
    }
  }

  const handleConfirmSchedule = (scheduledIso: string) => {
    if (!createdBundleId) return
    approveAndSchedule.mutate(
      { scheduled_at: scheduledIso },
      {
        onSuccess: () => {
          router.push(`/clubs/${slug}/contents?tab=calendar`)
        },
      },
    )
  }

  const handlePublishNow = () => {
    if (!createdBundleId) return
    approveNow.mutate(undefined, {
      onSuccess: () => {
        router.push(`/clubs/${slug}/bundles/${createdBundleId}`)
      },
    })
  }

  const handleSaveDraft = () => {
    if (!createdBundleId) return
    // 덱은 이미 pending_approval 상태로 DB에 있음 — 상세로 이동만
    toast.success('내 덱 모음에 저장했습니다', {
      description: '나중에 승인해서 발행하시거나, 일부만 수정해 재사용하실 수 있습니다.',
    })
    router.push(`/clubs/${slug}/contents?tab=decks`)
  }

  // 페르소나가 없으면 먼저 만들라고 안내
  if (club && personaData && !persona) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-base font-bold text-txt-primary mb-2">
          먼저 페르소나를 만들어주세요
        </p>
        <p className="text-sm text-txt-secondary mb-6 leading-relaxed">
          AI가 글을 쓰려면 {club.name}의 "말투"를 먼저 알아야 합니다.
          <br />
          페르소나 설정에서 3분만 투자하시면 됩니다.
        </p>
        <Link
          href={`/clubs/${slug}/settings/persona`}
          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
        >
          <Sparkles size={14} />
          페르소나 먼저 만들기
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href={`/clubs/${slug}/settings/persona`}
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-txt-primary">
            {scheduleMode ? '자동 발행 예약 만들기' : 'AI에게 어떤 글을 부탁할까요?'}
          </h1>
          <p className="text-xs text-txt-tertiary leading-relaxed">
            {scheduleMode
              ? `${club?.name ?? '우리 동아리'} 페르소나로 글을 준비한 뒤, 원하는 시간에 자동으로 올려드립니다.`
              : `${club?.name ?? '우리 동아리'} 페르소나를 기반으로 인스타·LinkedIn·에타·이메일·Discord용 글을 한 번에 준비합니다.`}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator step={step} scheduleMode={scheduleMode} />

      {/* Step content */}
      {step === 'pick-event' && (
        <PickEventStep
          onPick={(ev) => {
            setSelectedEvent(ev)
            setMeta(getDefaultMeta(ev))
            setStep('fill-meta')
          }}
        />
      )}

      {step === 'fill-meta' && selectedDef && (
        <FillMetaStep
          def={selectedDef}
          meta={meta}
          onChange={setMeta}
          onBack={() => setStep('pick-event')}
          onSubmit={handleGenerate}
          canSubmit={isAdmin && !!persona}
        />
      )}

      {step === 'generating' && selectedDef && (
        <GeneratingStep def={selectedDef} />
      )}

      {step === 'schedule' && selectedDef && createdBundleId && (
        <ScheduleStep
          def={selectedDef}
          bundleId={createdBundleId}
          slug={slug}
          isScheduling={approveAndSchedule.isPending}
          isPublishingNow={approveNow.isPending}
          onSchedule={handleConfirmSchedule}
          onPublishNow={handlePublishNow}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {step === 'error' && (
        <ErrorStep
          message={errorMessage ?? '알 수 없는 오류'}
          onRetry={() => setStep(selectedEvent ? 'fill-meta' : 'pick-event')}
        />
      )}
    </>
  )
}

// ============================================================
// Step indicator
// ============================================================
function StepIndicator({
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

// ============================================================
// Step 1: Pick event
// ============================================================
function PickEventStep({ onPick }: { onPick: (ev: EventType) => void }) {
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
                  <h3 className="text-sm font-bold text-txt-primary">
                    {ev.label}
                  </h3>
                  <p className="text-[11px] text-txt-tertiary">{ev.tagline}</p>
                </div>
              </div>
              <p className="text-xs text-txt-secondary leading-relaxed mb-3">
                {ev.useCase}
              </p>
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

// ============================================================
// Step 2: Fill metadata
// ============================================================
function FillMetaStep({
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
  const fields = META_FIELDS[def.key] ?? []
  const valid = fields
    .filter((f) => f.required)
    .every((f) => !!meta[f.name]?.trim())

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
                {f.required && (
                  <span className="text-status-danger-text ml-1">*</span>
                )}
                {!f.required && (
                  <span className="text-[11px] text-txt-tertiary ml-1 font-normal">
                    (선택)
                  </span>
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
                  onChange={(e) =>
                    onChange({ ...meta, [f.name]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors leading-relaxed resize-none"
                />
              ) : f.type === 'select' ? (
                <select
                  value={meta[f.name] ?? ''}
                  onChange={(e) =>
                    onChange({ ...meta, [f.name]: e.target.value })
                  }
                  className="w-full h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
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
                  onChange={(e) =>
                    onChange({ ...meta, [f.name]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className="w-full h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
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

// ============================================================
// Step 3: Generating
// ============================================================
function GeneratingStep({ def }: { def: EventDef }) {
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

// ============================================================
// Error step
// ============================================================
// ============================================================
// Step 4 (예약 모드만): 언제 올릴지 + 모바일 프리뷰 + 3버튼
// mirra 020559 패턴 — 좌 폼, 우 플랫폼 프리뷰.
// ============================================================
function ScheduleStep({
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
    () =>
      outputs.find(
        (o) => o.channel_format === currentPreview,
      ),
    [outputs, currentPreview],
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
        description: '지금 바로 발행하시려면 "바로 발행" 버튼을, 예약은 미래 시점만 지정해 주세요.',
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
            <h2 className="text-base font-bold text-txt-primary mb-0.5">
              언제 올릴까요?
            </h2>
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
          <span className="block text-xs font-semibold text-txt-primary mb-1.5">
            예약 시간
          </span>
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-11 text-sm text-txt-primary bg-surface-bg border border-border rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
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

/**
 * 모바일 핸드셋 프레임 안에 플랫폼 게시물 모양으로 미리보기.
 * ChannelFrame이 있지만 더 간단한 미니 프리뷰로 렌더(속도·컴팩트함).
 */
function MobilePreview({
  format,
  content,
}: {
  format: ChannelFormat | null
  content: string
}) {
  if (!format || !content) {
    return (
      <div className="aspect-[9/19] rounded-[2.5rem] bg-surface-bg border-2 border-border/60 flex items-center justify-center p-6">
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
      <div className="rounded-[2rem] bg-white overflow-hidden min-h-[520px]">
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
          <p className="text-[12px] text-zinc-800 whitespace-pre-wrap leading-relaxed break-words">
            {content.slice(0, 800)}
            {content.length > 800 && '…'}
          </p>
        </div>
      </div>
    </div>
  )
}

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

function ErrorStep({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="max-w-xl mx-auto text-center py-12">
      <p className="text-base font-bold text-txt-primary mb-2">
        글을 만들지 못했습니다
      </p>
      <p className="text-sm text-txt-secondary leading-relaxed mb-5">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
      >
        다시 시도
      </button>
    </div>
  )
}

// ============================================================
// Event meta field definitions
// ============================================================
interface MetaField {
  name: string
  label: string
  type: 'text' | 'date' | 'url' | 'number' | 'textarea' | 'select'
  required: boolean
  placeholder?: string
  hint?: string
  options?: Array<{ value: string; label: string }>
}

const META_FIELDS: Record<EventType, MetaField[]> = {
  announcement: [
    {
      name: 'category',
      label: '어떤 종류의 공지인가요?',
      type: 'select',
      required: true,
      options: [
        { value: 'general', label: '일반 공지' },
        { value: 'meeting', label: '모임 안내' },
        { value: 'event', label: '이벤트 공지' },
        { value: 'study', label: '스터디 모집' },
        { value: 'recap', label: '후기·회고' },
        { value: 'partnership', label: '제휴·스폰서 소식' },
        { value: 'recruiting_members', label: '구성원 모집 (팀원·운영진)' },
        { value: 'other', label: '기타' },
      ],
      hint: '분류에 따라 AI가 톤과 구조를 맞춥니다.',
    },
    {
      name: 'title',
      label: '공지 제목',
      type: 'text',
      required: true,
      placeholder: '예: 다음 주 화요일 AI 툴 워크숍',
      hint: '회장님이 머릿속에 떠올린 제목 그대로. AI가 이걸 기반으로 채널별로 다시 씁니다.',
    },
    {
      name: 'body_hint',
      label: '꼭 들어가야 하는 내용',
      type: 'textarea',
      required: false,
      placeholder: '예: 오후 7시 경희대 노벨정 301호. 노트북 지참. 선착순 20명.',
      hint: '선택. 빈칸이면 AI가 페르소나 기반으로 알아서 씁니다.',
    },
    {
      name: 'date',
      label: '언제 (관련 날짜)',
      type: 'text',
      required: false,
      placeholder: '예: 2026년 4월 25일 오후 7시',
      hint: '선택. 행사·모임 날짜가 있으면 적어주세요.',
    },
    {
      name: 'location',
      label: '어디서',
      type: 'text',
      required: false,
      placeholder: '예: 경희대 노벨정 301호 / Zoom 링크',
    },
    {
      name: 'call_to_action',
      label: '독자가 했으면 하는 행동',
      type: 'text',
      required: false,
      placeholder: '예: DM 주세요 / 지원 링크에서 신청 / 후기 댓글 남기기',
      hint: '선택. 있으면 AI가 글 끝에 명확한 행동 유도를 넣습니다.',
    },
    {
      name: 'link',
      label: '관련 링크',
      type: 'url',
      required: false,
      placeholder: 'https://...',
    },
  ],

  recruit_open: [
    {
      name: 'cohort',
      label: '기수',
      type: 'text',
      required: true,
      placeholder: '예: 10-1기',
      hint: '동아리에서 부르는 기수명 그대로 적어주세요. 대회 이름처럼 자유롭게.',
    },
    {
      name: 'deadline',
      label: '지원 마감일',
      type: 'date',
      required: true,
      hint: '모집 마감 날짜. "D-7" 같은 긴박감을 AI가 글에 녹입니다.',
    },
    {
      name: 'apply_url',
      label: '지원 링크',
      type: 'url',
      required: true,
      placeholder: 'https://forms.gle/...',
      hint: '구글폼·타입폼·노션 등 지원서 작성 페이지 URL.',
    },
    {
      name: 'target_count',
      label: '목표 인원',
      type: 'number',
      required: false,
      placeholder: '30',
      hint: '선택. 적으시면 "30명 선발" 같이 구체적으로 반영됩니다.',
    },
  ],
  weekly_update: [
    {
      name: 'week_number',
      label: '주차',
      type: 'number',
      required: true,
      placeholder: '5',
      hint: '이번이 몇 주차인지. 학기 전체 일정에서 지금 위치를 AI가 이해합니다.',
    },
    {
      name: 'cohort',
      label: '기수',
      type: 'text',
      required: false,
      placeholder: '예: 10-1기',
      hint: '선택. 기수 표기를 원하시면 입력.',
    },
  ],
  final_showcase: [
    {
      name: 'event_date',
      label: '쇼케이스 날짜',
      type: 'date',
      required: true,
      hint: '데모데이·발표회 당일 날짜.',
    },
    {
      name: 'venue',
      label: '장소',
      type: 'text',
      required: false,
      placeholder: '예: 경희대 크라운관 201호',
      hint: '선택. 오프라인이면 장소, 온라인이면 "Zoom" 등.',
    },
    {
      name: 'cohort',
      label: '기수',
      type: 'text',
      required: false,
      placeholder: '예: 10-1기',
    },
    {
      name: 'highlights',
      label: '주요 성과 요약',
      type: 'textarea',
      required: false,
      placeholder: '예: MVP 8개, 투자 1건, BEP 돌파 2팀',
      hint: '선택. 자랑할 거리를 적어주시면 AI가 글 전반에 녹입니다.',
    },
  ],
  // 나머지 이벤트는 현재 UI에서 생성 불가 (R3.2+)
  recruit_teaser: [],
  recruit_close: [],
  onboarding: [],
  project_kickoff: [],
  monthly_recap: [],
  mid_showcase: [],
  sponsor_outreach: [],
  semester_report: [],
  vacation_harvest: [],
}

function getDefaultMeta(_ev: EventType): Record<string, string> {
  return {}
}

function toTypedMeta(
  ev: EventType,
  raw: Record<string, string>,
): Record<string, unknown> {
  const fields = META_FIELDS[ev] ?? []
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    const v = raw[f.name]
    if (!v?.trim()) continue
    if (f.type === 'number') {
      const n = Number(v)
      if (!Number.isNaN(n)) out[f.name] = n
    } else {
      out[f.name] = v.trim()
    }
  }
  return out
}
