'use client'

import { useMemo } from 'react'
import { CheckCircle2, Circle, Lightbulb, Compass, Hammer, Rocket, MessageSquare, FileText } from 'lucide-react'
import { UPDATE_TYPE_CONFIG } from './types'
import type { ProjectUpdate } from '@/src/hooks/useProjectUpdates'
import { toReadableContent } from '@/src/lib/ghostwriter/format-content'

interface ProjectTimelineProps {
  updates: ProjectUpdate[]
  createdAt: string | null
  isOwner: boolean
}

function calcCurrentWeek(createdAt: string | null | undefined): number {
  if (!createdAt) return 1
  return Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000)))
}

const STAGE_ORDER = ['ideation', 'design', 'development', 'launch'] as const
type Stage = typeof STAGE_ORDER[number]

const STAGE_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }> = {
  ideation: { label: '아이디어', icon: Lightbulb, color: 'text-status-warning-text', bg: 'bg-status-warning-bg' },
  design: { label: '설계', icon: Compass, color: 'text-status-info-text', bg: 'bg-status-info-bg' },
  development: { label: '구현', icon: Hammer, color: 'text-status-success-text', bg: 'bg-status-success-bg' },
  launch: { label: '런칭', icon: Rocket, color: 'text-purple-700', bg: 'bg-purple-100' },
}

export function ProjectTimeline({ updates, createdAt, isOwner }: ProjectTimelineProps) {
  const currentWeek = calcCurrentWeek(createdAt)

  const weekMap = useMemo(() => {
    const map = new Map<number, ProjectUpdate[]>()
    for (const u of updates) {
      const list = map.get(u.week_number) ?? []
      list.push(u)
      map.set(u.week_number, list)
    }
    return map
  }, [updates])

  const weeks = useMemo(() => {
    const weeks: number[] = []
    for (let w = currentWeek; w >= 1; w -= 1) weeks.push(w)
    return weeks
  }, [currentWeek])

  const currentStage = useMemo<keyof typeof STAGE_META>(() => {
    for (const stage of [...STAGE_ORDER].reverse()) {
      if (updates.some(u => u.update_type === stage)) return stage
    }
    return 'ideation'
  }, [updates])

  const stageProgress = STAGE_ORDER.indexOf(currentStage as Stage)

  const coverage = useMemo(() => {
    const filled = new Set(updates.map(u => u.week_number))
    const total = currentWeek
    const done = Array.from(filled).filter(w => w <= currentWeek).length
    return { done, total, ratio: total > 0 ? done / total : 0 }
  }, [updates, currentWeek])

  return (
    <div className="space-y-6">
      {/* 스테이지 프로그레스 */}
      <div className="bg-surface-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-txt-primary">프로젝트 단계</h3>
          <span className="text-[12px] text-txt-tertiary">
            현재: <span className="font-semibold text-txt-primary">{STAGE_META[currentStage].label}</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          {STAGE_ORDER.map((stage, idx) => {
            const meta = STAGE_META[stage]
            const Icon = meta.icon
            const reached = idx <= stageProgress
            const active = idx === stageProgress
            return (
              <div key={stage} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  reached ? `${meta.bg} ${meta.color}` : 'bg-surface-sunken text-txt-disabled'
                } ${active ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface-card' : ''}`}>
                  <Icon size={16} />
                </div>
                <span className={`text-[11px] font-semibold truncate ${reached ? 'text-txt-primary' : 'text-txt-disabled'}`}>
                  {meta.label}
                </span>
                {idx < STAGE_ORDER.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 h-1 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${((stageProgress + 1) / STAGE_ORDER.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 주간 업데이트 커버리지 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CoverageCard
          value={`${coverage.done}/${coverage.total}`}
          label="업데이트 주차"
          hint={coverage.ratio >= 0.8 ? '꾸준히 기록 중' : coverage.ratio >= 0.5 ? '보통' : '기록 부족'}
          tone={coverage.ratio >= 0.8 ? 'success' : coverage.ratio >= 0.5 ? 'neutral' : 'alert'}
        />
        <CoverageCard
          value={updates.length}
          label="총 업데이트"
          hint={`주당 평균 ${currentWeek > 0 ? (updates.length / currentWeek).toFixed(1) : '0'}건`}
          tone="neutral"
        />
        <CoverageCard
          value={currentWeek}
          label="진행 주차"
          hint={createdAt ? `${new Date(createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 개설` : '-'}
          tone="neutral"
        />
      </div>

      {/* 주차별 타임라인 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-txt-primary">주차별 활동</h3>
          <span className="text-[12px] text-txt-tertiary">{currentWeek}주차까지 기록</span>
        </div>

        <div className="relative">
          {/* 세로 라인 */}
          <div className="absolute left-[15px] top-2 bottom-2 w-[1.5px] bg-border" aria-hidden />

          <ul className="space-y-3">
            {weeks.map(week => {
              const items = weekMap.get(week) ?? []
              const hasUpdate = items.length > 0
              return (
                <li key={week} className="relative pl-10">
                  {/* 노드 */}
                  <div className={`absolute left-0 top-4 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    hasUpdate
                      ? 'bg-brand border-brand text-white'
                      : 'bg-surface-bg border-border text-txt-disabled'
                  }`}>
                    {hasUpdate ? <CheckCircle2 size={14} /> : <Circle size={10} />}
                  </div>

                  {/* 카드 */}
                  {hasUpdate ? (
                    <div className="space-y-2">
                      {items.map(u => {
                        const config = UPDATE_TYPE_CONFIG[u.update_type] ?? UPDATE_TYPE_CONFIG.general
                        const readable = toReadableContent(u.content)
                        const [firstLine, ...rest] = readable.split('\n')
                        return (
                          <div
                            key={u.id}
                            className="bg-surface-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[13px] font-bold text-txt-primary">{week}주차</span>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 border rounded-full ${config.badgeColor}`}>
                                {config.label}
                              </span>
                              {u.created_at && (
                                <span className="text-[11px] text-txt-tertiary">
                                  {new Date(u.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-[14px] font-semibold text-txt-primary mb-1">{u.title}</p>
                            <p className="text-[13px] text-txt-secondary leading-relaxed line-clamp-2 whitespace-pre-line">
                              {firstLine}
                              {rest.length > 0 && '…'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-surface-sunken/50 border border-dashed border-border rounded-xl p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-txt-tertiary">{week}주차</span>
                        <span className="text-[12px] text-txt-disabled">업데이트 미작성</span>
                      </div>
                      {isOwner && week === currentWeek && (
                        <p className="text-[11px] text-txt-tertiary mt-1">
                          이번 주 회고를 남기면 팀원들에게 알림이 갑니다
                        </p>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {updates.length === 0 && (
          <div className="mt-4 bg-surface-card border border-border rounded-2xl p-8 text-center">
            <FileText size={24} className="text-txt-disabled mx-auto mb-2" />
            <p className="text-[14px] font-semibold text-txt-primary mb-1">
              첫 업데이트를 기다리고 있습니다
            </p>
            <p className="text-[12px] text-txt-tertiary">
              주간 회고 · 결정사항 · 블로커 등을 남기면 팀 히스토리가 쌓입니다
            </p>
          </div>
        )}
      </div>

      {/* 가이드 */}
      {isOwner && (
        <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 flex gap-3">
          <MessageSquare size={16} className="text-brand shrink-0 mt-0.5" />
          <div className="text-[13px] text-txt-secondary leading-relaxed">
            <p className="font-semibold text-txt-primary mb-1">히스토리가 자산입니다</p>
            <p>디스코드는 흐름, Draft는 기록입니다. 주차마다 남긴 회고가 다음 기수에게 전달됩니다</p>
          </div>
        </div>
      )}
    </div>
  )
}

function CoverageCard({ value, label, hint, tone }: {
  value: number | string
  label: string
  hint: string
  tone: 'success' | 'neutral' | 'alert'
}) {
  const toneClass = tone === 'success' ? 'text-status-success-text' : tone === 'alert' ? 'text-status-danger-text' : 'text-txt-primary'
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4">
      <div className={`text-[22px] font-bold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-[13px] text-txt-tertiary mt-0.5">{label}</div>
      <div className="text-[11px] text-txt-disabled mt-1">{hint}</div>
    </div>
  )
}
