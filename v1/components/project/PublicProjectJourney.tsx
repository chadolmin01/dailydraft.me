'use client'

import { useMemo } from 'react'
import { Lightbulb, Compass, Hammer, Rocket, CheckCircle2, Sparkles } from 'lucide-react'
import type { ProjectUpdate } from '@/src/hooks/useProjectUpdates'

interface Props {
  updates: ProjectUpdate[]
  createdAt: string | null
}

const STAGES = [
  { key: 'ideation', label: '아이디어', icon: Lightbulb, bg: 'bg-status-warning-bg', text: 'text-status-warning-text' },
  { key: 'design', label: '설계', icon: Compass, bg: 'bg-status-info-bg', text: 'text-status-info-text' },
  { key: 'development', label: '구현', icon: Hammer, bg: 'bg-status-success-bg', text: 'text-status-success-text' },
  { key: 'launch', label: '런칭', icon: Rocket, bg: 'bg-purple-100', text: 'text-purple-700' },
] as const

function calcWeek(createdAt: string | null): number {
  if (!createdAt) return 1
  return Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (7 * 86_400_000)))
}

export function PublicProjectJourney({ updates, createdAt }: Props) {
  const currentWeek = calcWeek(createdAt)

  const { currentStage, stagesPassed, updatesPerWeek, coverage } = useMemo(() => {
    const stageOrder: string[] = STAGES.map(s => s.key)
    const stagesWithUpdate = new Set<string>(
      updates.map(u => u.update_type as string).filter(t => stageOrder.includes(t))
    )

    let latestStageIdx = 0
    for (let i = stageOrder.length - 1; i >= 0; i -= 1) {
      if (stagesWithUpdate.has(stageOrder[i])) {
        latestStageIdx = i
        break
      }
    }

    const filledWeeks = new Set(updates.map(u => u.week_number))
    const coverage = currentWeek > 0 ? Math.round((filledWeeks.size / currentWeek) * 100) : 0
    const updatesPerWeek = currentWeek > 0 ? Math.round((updates.length / currentWeek) * 10) / 10 : 0

    return {
      currentStage: stageOrder[latestStageIdx],
      stagesPassed: latestStageIdx + (stagesWithUpdate.size > 0 ? 1 : 0),
      updatesPerWeek,
      coverage,
    }
  }, [updates, currentWeek])

  if (updates.length === 0) return null

  const isConsistent = coverage >= 70

  return (
    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Sparkles size={14} className="text-brand" />
        <h3 className="text-[14px] font-bold text-txt-primary">프로젝트 여정</h3>
        <span className="text-[12px] text-txt-tertiary ml-auto">
          {currentWeek}주차 · 업데이트 {updates.length}건
        </span>
      </div>

      {/* 스테이지 프로그레스 */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon
            const reached = idx < stagesPassed
            const active = stage.key === currentStage
            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  reached ? `${stage.bg} ${stage.text}` : 'bg-surface-sunken text-txt-disabled'
                } ${active ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface-card' : ''}`}>
                  <Icon size={14} />
                </div>
                <span className={`text-[11px] font-semibold truncate ${reached ? 'text-txt-primary' : 'text-txt-disabled'}`}>
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>

        <div className="h-1 bg-surface-sunken rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${(stagesPassed / STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 신뢰 배지 */}
      <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
        <div className="px-4 py-3 text-center">
          <div className="text-[18px] font-bold text-txt-primary tabular-nums">{updates.length}</div>
          <div className="text-[11px] text-txt-tertiary mt-0.5">회고 기록</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-[18px] font-bold text-txt-primary tabular-nums">{updatesPerWeek}</div>
          <div className="text-[11px] text-txt-tertiary mt-0.5">주당 평균</div>
        </div>
        <div className="px-4 py-3 text-center flex flex-col items-center">
          <div className={`text-[18px] font-bold tabular-nums flex items-center gap-1 ${
            isConsistent ? 'text-status-success-text' : 'text-txt-primary'
          }`}>
            {isConsistent && <CheckCircle2 size={13} />}
            {coverage}%
          </div>
          <div className="text-[11px] text-txt-tertiary mt-0.5">
            {isConsistent ? '꾸준한 기록' : '기록 커버리지'}
          </div>
        </div>
      </div>
    </div>
  )
}
