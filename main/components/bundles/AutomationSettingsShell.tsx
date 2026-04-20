'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Plus,
  Trash2,
  Clock,
  Power,
  Zap,
  ShieldCheck,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useClub } from '@/src/hooks/useClub'
import { usePersonaByOwner } from '@/src/hooks/usePersona'
import {
  usePersonaAutomations,
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
  type AutomationFrequency,
  type PersonaAutomationRow,
} from '@/src/hooks/usePersonaAutomations'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { EVENT_CONFIG } from '@/src/lib/personas/event-catalog'
import { EVENT_TYPES, type EventType } from '@/src/lib/personas/types'

interface Props {
  slug: string
  embedded?: boolean
}

const FREQUENCY_OPTIONS: Array<{
  value: AutomationFrequency
  label: string
  hint: string
}> = [
  { value: 'daily', label: '매일', hint: '매일 지정 시각에' },
  { value: 'weekly', label: '매주', hint: '매주 정해진 요일·시각에' },
  { value: 'biweekly', label: '격주', hint: '2주마다 같은 요일·시각에' },
  { value: 'monthly', label: '매월', hint: '매월 정해진 날짜·시각에' },
]

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

/**
 * mirra 020621 자동화 설정 패턴.
 *
 * 한 페이지에서 여러 "자동 생성 규칙"을 관리:
 *   - 매주 일요일 오후 3시 → weekly_update 덱 자동 생성 (검토 대기)
 *   - 매일 아침 9시 → 공지 1개 자동 생성 (자동 발행 OFF)
 *   - ...
 */
export function AutomationSettingsShell({ slug, embedded = false }: Props) {
  const { data: club } = useClub(slug)
  const { data: personaData } = usePersonaByOwner('club', club?.id)
  const persona = personaData?.persona
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  const { data, isLoading } = usePersonaAutomations(persona?.id)
  const update = useUpdateAutomation(persona?.id)
  const del = useDeleteAutomation(persona?.id)

  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const automations = data?.automations ?? []

  return (
    <>
      <div
        className={`flex items-start gap-3 mb-4 ${embedded ? 'justify-end' : 'justify-between'}`}
      >
        {!embedded && (
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/clubs/${slug}/contents?tab=calendar`}
              className="text-txt-tertiary hover:text-txt-primary transition-colors shrink-0"
              aria-label="뒤로"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-txt-primary">자동화 설정</h1>
              <p className="text-xs text-txt-tertiary leading-relaxed">
                AI가 정해진 시간마다 자동으로 덱을 생성(또는 발행)하게 설정합니다.
              </p>
            </div>
          </div>
        )}
        {isAdmin && persona && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors shrink-0"
          >
            <Plus size={14} />새 자동화
          </button>
        )}
      </div>

      {!persona ? (
        <EmptyBlock
          title="페르소나가 먼저 필요합니다"
          hint="자동화를 설정하려면 동아리 페르소나가 있어야 합니다."
          cta={{ label: '페르소나 설정하러 가기', href: `/clubs/${slug}/settings/persona` }}
        />
      ) : (
        <>
          {/* 생성 폼 */}
          {showForm && persona && isAdmin && (
            <div className="mb-4">
              <CreateAutomationForm
                personaId={persona.id}
                onDone={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* 기존 자동화 리스트 */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-32 rounded-2xl skeleton-shimmer" />
              <div className="h-32 rounded-2xl skeleton-shimmer" />
            </div>
          ) : automations.length === 0 && !showForm ? (
            <EmptyBlock
              title="설정된 자동화가 없습니다"
              hint='매주 일요일 오후 3시에 "주간 업데이트"를 자동 생성하는 식으로 시작해보십시오.'
              cta={
                isAdmin
                  ? { label: '+ 새 자동화', href: '#', onClick: () => setShowForm(true) }
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {automations.map((a) => (
                <AutomationCard
                  key={a.id}
                  automation={a}
                  canEdit={isAdmin}
                  onToggle={(active) =>
                    update.mutate(
                      { id: a.id, patch: { active } },
                      {
                        onSuccess: () =>
                          toast.success(
                            active ? '자동화가 활성화되었습니다' : '자동화가 일시 중지되었습니다',
                          ),
                      },
                    )
                  }
                  onDelete={() => setDeleteTarget(a.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await del.mutateAsync(deleteTarget)
          setDeleteTarget(null)
        }}
        title="이 자동화를 삭제하시겠습니까?"
        message="삭제하시면 이후 이 스케줄로 덱이 생성되지 않습니다. 이미 생성된 덱은 유지됩니다."
        confirmText="삭제합니다"
        cancelText="돌아가기"
        variant="danger"
      />
    </>
  )
}

// ============================================================
// Card
// ============================================================
function AutomationCard({
  automation,
  canEdit,
  onToggle,
  onDelete,
}: {
  automation: PersonaAutomationRow
  canEdit: boolean
  onToggle: (active: boolean) => void
  onDelete: () => void
}) {
  const eventLabel =
    EVENT_CONFIG[automation.event_type as EventType]?.label ??
    automation.event_type
  const freqLabel = describeSchedule(automation)
  const nextAt = automation.next_run_at
    ? formatAt(automation.next_run_at)
    : '중지됨'
  const lastAt = automation.last_run_at ? formatAt(automation.last_run_at) : '—'

  return (
    <article className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-semibold text-brand">
              {eventLabel}
            </span>
            {automation.auto_publish ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">
                <Zap size={10} />
                자동 발행
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-bg text-txt-tertiary">
                <ShieldCheck size={10} />
                검토 후 발행
              </span>
            )}
            {!automation.active && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-danger-text/10 text-status-danger-text">
                일시 중지
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-txt-primary">{freqLabel}</h3>
          {automation.daily_count > 1 && (
            <p className="text-[11px] text-txt-tertiary mt-0.5">
              한 번에 {automation.daily_count}개씩 생성
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggle(!automation.active)}
              className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                automation.active
                  ? 'border-border text-txt-secondary hover:bg-surface-bg'
                  : 'border-brand-border text-brand bg-brand-bg hover:opacity-90'
              }`}
            >
              <Power size={11} />
              {automation.active ? '일시 중지' : '활성화'}
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-lg border border-border text-txt-tertiary hover:text-status-danger-text hover:border-status-danger-text/30 transition-colors inline-flex items-center justify-center"
              aria-label="삭제"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 pt-3 border-t border-border text-[11px] text-txt-tertiary">
        <span className="inline-flex items-center gap-1">
          <Clock size={11} />
          다음: <strong className="text-txt-primary font-semibold">{nextAt}</strong>
        </span>
        <span className="inline-flex items-center gap-1">
          마지막:{' '}
          <strong className="text-txt-secondary font-semibold">{lastAt}</strong>
          {automation.last_run_status && (
            <em
              className={`not-italic ml-1 ${
                automation.last_run_status === 'ok'
                  ? 'text-status-success-text'
                  : 'text-status-danger-text'
              }`}
            >
              ({statusLabel(automation.last_run_status)})
            </em>
          )}
        </span>
      </div>
    </article>
  )
}

// ============================================================
// 생성 폼
// ============================================================
function CreateAutomationForm({
  personaId,
  onDone,
  onCancel,
}: {
  personaId: string
  onDone: () => void
  onCancel: () => void
}) {
  const create = useCreateAutomation(personaId)

  const [eventType, setEventType] = useState<EventType>('weekly_update')
  const [frequency, setFrequency] = useState<AutomationFrequency>('weekly')
  const [runHour, setRunHour] = useState(9)
  const [runMinute, setRunMinute] = useState(0)
  const [runWeekday, setRunWeekday] = useState(0)
  const [runDayOfMonth, setRunDayOfMonth] = useState(1)
  const [dailyCount, setDailyCount] = useState(1)
  const [autoPublish, setAutoPublish] = useState(false)

  const submit = () => {
    create.mutate(
      {
        event_type: eventType,
        frequency,
        run_hour: runHour,
        run_minute: runMinute,
        run_weekday:
          frequency === 'weekly' || frequency === 'biweekly' ? runWeekday : null,
        run_day_of_month: frequency === 'monthly' ? runDayOfMonth : null,
        daily_count: dailyCount,
        auto_publish: autoPublish,
      },
      {
        onSuccess: () => onDone(),
      },
    )
  }

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <Plus size={18} className="text-brand" />
        </div>
        <div>
          <h2 className="text-base font-bold text-txt-primary mb-0.5">
            새 자동화 만들기
          </h2>
          <p className="text-xs text-txt-tertiary leading-relaxed">
            어떤 덱을 언제 자동으로 생성할지 설정하십시오.
          </p>
        </div>
      </div>

      {/* 어떤 글? */}
      <div>
        <label className="block text-xs font-semibold text-txt-primary mb-1.5">
          어떤 글을 만들지
        </label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
          className="w-full h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-lg px-3 focus:outline-none focus:border-brand"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_CONFIG[t as EventType]?.label ?? t}
            </option>
          ))}
        </select>
      </div>

      {/* 얼마나 자주 */}
      <div>
        <label className="block text-xs font-semibold text-txt-primary mb-1.5">
          얼마나 자주
        </label>
        <div className="grid grid-cols-4 gap-2">
          {FREQUENCY_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFrequency(f.value)}
              className={`px-2 py-2 rounded-lg text-xs font-semibold transition-colors ${
                frequency === f.value
                  ? 'bg-brand text-white'
                  : 'bg-surface-bg text-txt-secondary border border-border hover:bg-surface-card'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-txt-tertiary mt-2">
          {FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.hint}
        </p>
      </div>

      {/* 요일 / 일자 */}
      {(frequency === 'weekly' || frequency === 'biweekly') && (
        <div>
          <label className="block text-xs font-semibold text-txt-primary mb-1.5">
            어떤 요일
          </label>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                onClick={() => setRunWeekday(i)}
                className={`w-10 h-10 rounded-lg text-xs font-semibold transition-colors ${
                  runWeekday === i
                    ? 'bg-txt-primary text-surface-card'
                    : 'bg-surface-bg text-txt-secondary border border-border hover:bg-surface-card'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {frequency === 'monthly' && (
        <div>
          <label className="block text-xs font-semibold text-txt-primary mb-1.5">
            매월 며칠
          </label>
          <input
            type="number"
            min={1}
            max={28}
            value={runDayOfMonth}
            onChange={(e) => setRunDayOfMonth(Number(e.target.value))}
            className="w-24 h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-lg px-3 focus:outline-none focus:border-brand"
          />
          <p className="text-[11px] text-txt-tertiary mt-1">
            1~28일까지 선택 가능 (말일 보장을 위해)
          </p>
        </div>
      )}

      {/* 시간 */}
      <div>
        <label className="block text-xs font-semibold text-txt-primary mb-1.5">
          몇 시
        </label>
        <div className="flex items-center gap-2">
          <select
            value={runHour}
            onChange={(e) => setRunHour(Number(e.target.value))}
            className="h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-lg px-3 focus:outline-none focus:border-brand"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, '0')}시
              </option>
            ))}
          </select>
          <select
            value={runMinute}
            onChange={(e) => setRunMinute(Number(e.target.value))}
            className="h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-lg px-3 focus:outline-none focus:border-brand"
          >
            {[0, 15, 30, 45].map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}분
              </option>
            ))}
          </select>
          <span className="text-[11px] text-txt-tertiary">(KST)</span>
        </div>
      </div>

      {/* 일일 개수 */}
      <div>
        <label className="block text-xs font-semibold text-txt-primary mb-1.5">
          한 번에 몇 개
        </label>
        <input
          type="number"
          min={1}
          max={5}
          value={dailyCount}
          onChange={(e) => setDailyCount(Number(e.target.value))}
          className="w-24 h-10 text-sm text-txt-primary bg-surface-bg border border-border rounded-lg px-3 focus:outline-none focus:border-brand"
        />
        <p className="text-[11px] text-txt-tertiary mt-1">1~5개 (보통 1개 권장)</p>
      </div>

      {/* 자동 발행 토글 */}
      <div className="flex items-start gap-3 p-3 bg-surface-bg rounded-xl border border-border">
        <button
          onClick={() => setAutoPublish((v) => !v)}
          className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${
            autoPublish ? 'bg-brand' : 'bg-border'
          }`}
          role="switch"
          aria-checked={autoPublish}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              autoPublish ? 'translate-x-4' : ''
            }`}
          />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-txt-primary">
            자동 발행 활성화
          </p>
          <p className="text-[11px] text-txt-tertiary leading-relaxed mt-0.5">
            {autoPublish
              ? '생성되자마자 Discord 포럼·LinkedIn 같은 연결 채널에 바로 올라갑니다. 검토 과정 없음.'
              : '생성된 덱은 "내 덱 모음"에 쌓입니다. 회장이 검토 후 승인하셔야 올라갑니다.'}
          </p>
        </div>
      </div>

      {autoPublish && (
        <div className="flex gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-txt-secondary leading-relaxed">
            <strong className="text-amber-700">자동 발행 경고</strong>: AI가 만드는 글이 항상 완벽하진 않습니다. 민감한 주제(모집·후원·공식 발표)는 <strong>검토 후 발행</strong>으로 두시기를 권장합니다.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          onClick={onCancel}
          disabled={create.isPending}
          className="h-10 px-4 rounded-lg text-sm font-semibold text-txt-secondary hover:bg-surface-bg transition-colors disabled:opacity-60"
        >
          취소
        </button>
        <button
          onClick={submit}
          disabled={create.isPending}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-60"
        >
          {create.isPending && <Loader2 size={14} className="animate-spin" />}
          {create.isPending ? '저장 중' : '자동화 저장'}
        </button>
      </div>
    </section>
  )
}

// ============================================================
// Empty
// ============================================================
function EmptyBlock({
  title,
  hint,
  cta,
}: {
  title: string
  hint: string
  cta?: { label: string; href: string; onClick?: () => void }
}) {
  return (
    <div className="bg-surface-card border border-dashed border-border rounded-2xl p-10 text-center">
      <div className="w-11 h-11 mx-auto rounded-2xl bg-brand-bg flex items-center justify-center mb-3">
        <Info size={18} className="text-brand" />
      </div>
      <p className="text-sm font-bold text-txt-primary mb-1">{title}</p>
      <p className="text-xs text-txt-tertiary leading-relaxed mb-5 max-w-sm mx-auto">
        {hint}
      </p>
      {cta &&
        (cta.onClick ? (
          <button
            onClick={cta.onClick}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
          >
            {cta.label}
          </button>
        ) : (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
          >
            {cta.label}
          </Link>
        ))}
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================
function describeSchedule(a: PersonaAutomationRow): string {
  const hh = String(a.run_hour).padStart(2, '0')
  const mm = String(a.run_minute).padStart(2, '0')
  const time = `${hh}:${mm}`
  if (a.frequency === 'daily') return `매일 ${time}`
  if (a.frequency === 'weekly')
    return `매주 ${WEEKDAYS[a.run_weekday ?? 0]}요일 ${time}`
  if (a.frequency === 'biweekly')
    return `격주 ${WEEKDAYS[a.run_weekday ?? 0]}요일 ${time}`
  return `매월 ${a.run_day_of_month}일 ${time}`
}

function formatAt(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const same = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (same) return `오늘 ${hh}:${mm}`
  const tmr = new Date(now)
  tmr.setDate(now.getDate() + 1)
  if (d.toDateString() === tmr.toDateString()) return `내일 ${hh}:${mm}`
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}

function statusLabel(s: string): string {
  if (s === 'ok') return '성공'
  if (s === 'partial') return '일부 성공'
  return '실패'
}
