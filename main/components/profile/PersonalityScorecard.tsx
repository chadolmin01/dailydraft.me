'use client'

import { Sparkles, Info } from 'lucide-react'

/**
 * `<PersonalityScorecard>` — AI 인터뷰 6개 spectrum 결과 시각화.
 *
 * 인터뷰 후 personality(teamRole, communication, planning, risk, quality) +
 * time(hours_per_week) 이 DB 에 저장되지만 지금까지 화면 어디에도 표시되지 않았음.
 * 유저가 "인터뷰 왜 했지?" 느끼는 핵심 원인. 이제 프로필 About 탭에 노출해서
 * 매칭에 실제 반영되는 6축 값을 본인이 볼 수 있게.
 *
 * 매칭 로직 근거 (src/lib/ai/user-matcher.ts):
 * - teamRole 1=팔로워 · 5=리더 → 상호보완 점수
 * - communication 1=혼자 집중 · 5=수시 소통 → 유사 점수
 * - planning 1=즉흥 · 5=구조화 → 유사 점수
 * - risk 1=안정 · 5=도전 → 유사 점수
 * - quality 1=속도 · 5=완성도 → 유사 점수
 */

interface Personality {
  teamRole?: number
  communication?: number
  planning?: number
  risk?: number
  quality?: number
  time?: number
}

const DIMENSIONS: Array<{
  key: keyof Personality
  label: string
  lowLabel: string
  highLabel: string
  icon: string
}> = [
  { key: 'teamRole',      label: '팀 역할',      lowLabel: '팔로워',    highLabel: '리더',      icon: '👥' },
  { key: 'communication', label: '소통 스타일',   lowLabel: '혼자 집중', highLabel: '수시 소통', icon: '💬' },
  { key: 'risk',          label: '도전 성향',     lowLabel: '안정 추구', highLabel: '도전적',    icon: '⚡' },
  { key: 'planning',      label: '작업 방식',     lowLabel: '즉흥',      highLabel: '구조화',    icon: '🗂️' },
  { key: 'quality',       label: '완성도 vs 속도', lowLabel: '속도 우선', highLabel: '완성도 우선', icon: '💎' },
]

interface Props {
  personality: Personality | null | undefined
  hoursPerWeek?: number | null | undefined
  /** 본인 프로필인지 — true 면 "다시 하기" 링크 노출 */
  isOwn?: boolean
  /** 헤더 숨기고 값만 — 사이드바 컴팩트 모드 */
  compact?: boolean
}

export function PersonalityScorecard({ personality, hoursPerWeek, isOwn, compact }: Props) {
  const hasData = personality && Object.values(personality).some(
    v => typeof v === 'number' && v >= 1 && v <= 5,
  )
  if (!hasData) return null

  return (
    <section
      aria-labelledby="personality-scorecard-title"
      className="bg-surface-card border border-border rounded-2xl p-5"
    >
      {!compact && (
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2
              id="personality-scorecard-title"
              className="text-[15px] font-bold text-txt-primary flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-brand" aria-hidden="true" />
              AI 인터뷰 결과
            </h2>
            <p className="text-[11px] text-txt-tertiary mt-0.5 leading-relaxed">
              매칭 점수 계산에 쓰이는 5가지 축
            </p>
          </div>
          {isOwn && (
            <a
              href="/onboarding/interview"
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              다시 하기
            </a>
          )}
        </header>
      )}

      <ul className="space-y-3.5">
        {DIMENSIONS.map(({ key, ...rest }) => {
          const value = personality?.[key]
          if (typeof value !== 'number') return null
          return <DimensionBar key={key} {...rest} value={value} />
        })}
      </ul>

      {typeof hoursPerWeek === 'number' && hoursPerWeek > 0 && (
        <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-2">
          <span className="text-[11px] text-txt-tertiary">주당 투자 가능 시간</span>
          <span className="text-[13px] font-bold text-txt-primary tabular-nums">
            {hoursPerWeek}시간
          </span>
        </div>
      )}

      {!compact && (
        <div className="mt-4 pt-3 border-t border-border-subtle flex items-start gap-2">
          <Info size={11} className="text-txt-disabled shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[11px] text-txt-tertiary leading-relaxed">
            팀 매칭 점수는 이 5축과 스킬·관심사·현재 상황을 가중 평균해 계산됩니다.
            프로필 편집에서 언제든 수정 가능합니다.
          </p>
        </div>
      )}
    </section>
  )
}

/* ── 개별 차원 시각화 (5점 도트 + 라벨) ── */
function DimensionBar({
  label, lowLabel, highLabel, icon, value,
}: {
  label: string
  lowLabel: string
  highLabel: string
  icon: string
  value: number
}) {
  const pct = ((value - 1) / 4) * 100 // 1→0%, 5→100%

  return (
    <li>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-semibold text-txt-primary flex items-center gap-1.5">
          <span aria-hidden="true">{icon}</span>
          {label}
        </span>
        <span className="text-[11px] font-mono tabular-nums text-txt-tertiary">
          {value}/5
        </span>
      </div>
      {/* Track with 5 dots + filled portion */}
      <div className="relative h-1.5 bg-surface-sunken rounded-full overflow-hidden mb-1">
        <div
          className="absolute inset-y-0 left-0 bg-brand rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={value}
          aria-label={`${label}: ${value}점 / 5점`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-txt-disabled">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </li>
  )
}
