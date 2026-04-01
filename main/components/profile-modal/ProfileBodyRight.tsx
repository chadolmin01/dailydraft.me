import { Code2, Clock, Users } from 'lucide-react'
import { SliderBar } from './SliderBar'
import { traitLabels } from './types'
import { CATEGORICAL_LABELS, SCORE_TO_CATEGORICAL } from '@/src/lib/onboarding/constants'

function TraitBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-border-strong/60 hover:border-brand/30 transition-colors">
      <span className="text-[0.625rem] text-txt-tertiary font-mono uppercase">{label}</span>
      <span className="text-xs font-semibold text-txt-primary">{value}</span>
    </div>
  )
}

export function ProfileBodyRight({
  personality,
  workStyle,
  traits,
  teamPref,
  availability,
  skills,
}: {
  personality: Record<string, number> | null
  workStyle: Record<string, number> | undefined
  traits: Record<string, unknown> | undefined
  teamPref: Record<string, string> | undefined
  availability: { hours_per_week?: number; prefer_online?: boolean } | undefined
  skills: Array<{ name: string; level: string }> | null
}) {
  // Resolve categorical labels for work_style
  const getTraitLabel = (traitKey: string, scoreKey: string, source: Record<string, number> | null | undefined) => {
    const catId = traits?.[traitKey] as string | undefined
    const resolved = catId || (source?.[scoreKey] != null ? SCORE_TO_CATEGORICAL[traitKey]?.(source[scoreKey]) : undefined)
    return resolved ? CATEGORICAL_LABELS[traitKey]?.[resolved] : undefined
  }

  const collabLabel = getTraitLabel('collaboration_style', 'collaboration', workStyle)
  const planningLabel = getTraitLabel('planning_style', 'planning', workStyle)
  const qualityLabel = getTraitLabel('quality_style', 'perfectionism', workStyle)
  const decisionLabel = getTraitLabel('decision_style', 'decision', personality)

  const hasWorkStyleBadges = collabLabel || planningLabel || qualityLabel

  return (
    <div className="md:col-span-2 space-y-5 md:bg-white/60 md:border md:border-border md:rounded-xl md:p-5">
      {/* Empty state when right column has no data */}
      {!(personality && Object.keys(personality).length > 0) &&
       !hasWorkStyleBadges &&
       !(teamPref && Object.keys(teamPref).length > 0) &&
       !(availability && (availability.hours_per_week != null || availability.prefer_online != null)) &&
       !(skills && skills.length > 0) && (
        <div className="px-4 py-8 border border-border bg-white text-center rounded-xl">
          <p className="text-xs text-txt-disabled font-mono">아직 등록된 성향·스킬 정보가 없습니다</p>
        </div>
      )}

      {/* Personality Traits */}
      {personality && Object.keys(personality).length > 0 && (
        <section>
          <h3 className="text-[0.625rem] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-brand rounded-full" />
            성향 점수
          </h3>
          <div className="space-y-3">
            {/* decision → categorical badge */}
            {decisionLabel && (
              <TraitBadge label="의사결정" value={decisionLabel} />
            )}
            {/* communication → slider (spectrum) */}
            {traitLabels.filter(t => t.key === 'communication').map(({ key, label, low, high }) => {
              const val = personality[key]
              if (val == null) return null
              return <SliderBar key={key} value={val} low={low} high={high} label={label} colorKey={key} />
            })}
            {/* risk, time → sliders */}
            {traitLabels.filter(t => t.key === 'risk' || t.key === 'time').map(({ key, label, low, high }) => {
              const val = personality[key]
              if (val == null) return null
              return <SliderBar key={key} value={val} low={low} high={high} label={label} colorKey={key} />
            })}
          </div>
        </section>
      )}

      {/* Work Style — categorical badges */}
      {hasWorkStyleBadges && (
        <section>
          <h3 className="text-[0.625rem] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-violet-500 rounded-full" />
            작업 스타일
          </h3>
          <div className="space-y-1.5">
            {collabLabel && <TraitBadge label="협업" value={collabLabel} />}
            {planningLabel && <TraitBadge label="작업 방식" value={planningLabel} />}
            {qualityLabel && <TraitBadge label="품질 기준" value={qualityLabel} />}
          </div>
        </section>
      )}

      {/* Team Preference */}
      {teamPref && Object.keys(teamPref).length > 0 && (
        <section>
          <h3 className="text-[0.625rem] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-emerald-500 rounded-full" />
            <Users size={11} /> 팀 선호
          </h3>
          <div className="space-y-1.5">
            {teamPref.role && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-border-strong/60 hover:border-brand/30 transition-colors">
                <span className="text-[0.625rem] text-txt-tertiary font-mono uppercase">역할</span>
                <span className="text-xs font-semibold text-txt-primary">{teamPref.role}</span>
              </div>
            )}
            {teamPref.preferred_size && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-border-strong/60 hover:border-brand/30 transition-colors">
                <span className="text-[0.625rem] text-txt-tertiary font-mono uppercase">선호 규모</span>
                <span className="text-xs font-semibold text-txt-primary">{teamPref.preferred_size}</span>
              </div>
            )}
            {teamPref.atmosphere && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-border-strong/60 hover:border-brand/30 transition-colors">
                <span className="text-[0.625rem] text-txt-tertiary font-mono uppercase">분위기</span>
                <span className="text-xs font-semibold text-txt-primary">{teamPref.atmosphere}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Availability */}
      {availability && (availability.hours_per_week != null || availability.prefer_online != null) && (
        <section>
          <h3 className="text-[0.625rem] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-amber-500 rounded-full" />
            <Clock size={11} /> 가용 시간
          </h3>
          <div className="space-y-1.5">
            {availability.hours_per_week != null && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-border-strong/60 hover:border-brand/30 transition-colors">
                <span className="text-[0.625rem] text-txt-tertiary font-mono uppercase">주당 시간</span>
                <span className="text-xs font-semibold text-txt-primary">{availability.hours_per_week}시간</span>
              </div>
            )}
            {availability.prefer_online != null && (
              <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-border-strong/60 hover:border-brand/30 transition-colors">
                <span className="text-[0.625rem] text-txt-tertiary font-mono uppercase">작업 방식</span>
                <span className="text-xs font-semibold text-txt-primary">{availability.prefer_online ? '온라인 선호' : '오프라인 선호'}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section>
          <h3 className="text-[0.625rem] font-bold text-txt-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-0.5 h-3 bg-sky-500 rounded-full" />
            <Code2 size={11} /> 스킬
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-txt-primary text-xs font-medium border border-border-strong/60 rounded-xl hover:border-brand/40 hover:text-brand transition-colors"
              >
                {skill.name}
                <span className="text-txt-disabled">·</span>
                <span className="text-brand text-[0.625rem] font-bold">{skill.level}</span>
              </span>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
