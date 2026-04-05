'use client'

import { useState } from 'react'
import { Code2, Clock, Users, Brain, ChevronDown, Sparkles } from 'lucide-react'
import { SliderBar } from './SliderBar'
import { traitLabels } from './types'

/* ── Section Header ─────────────────────────────── */

function SectionHeader({ icon: Icon, label, color, count }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  color: string
  count?: number
}) {
  return (
    <h3 className="flex items-center gap-2 mb-3">
      <span className={`w-6 h-6 ${color} text-white flex items-center justify-center rounded-lg shadow-sm`}>
        <Icon size={12} />
      </span>
      <span className="text-xs font-bold text-txt-primary uppercase tracking-wide">{label}</span>
      {count != null && (
        <span className="ml-auto text-[10px] font-mono text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded-full">{count}</span>
      )}
    </h3>
  )
}

/* ── Trait Badge (interactive) ──────────────────── */

function TraitBadge({ label, value, icon: Icon, colorClass }: {
  label: string
  value: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  colorClass?: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`group flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border transition-all cursor-default ${
        hovered ? 'border-border-strong shadow-sm -translate-y-0.5' : 'border-border hover:border-border-strong'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-[11px] text-txt-secondary font-medium flex items-center gap-1.5">
        {Icon && <Icon size={12} className={`${colorClass || 'text-txt-tertiary'} transition-transform ${hovered ? 'scale-110' : ''}`} />}
        {label}
      </span>
      <span className={`text-xs font-bold ${colorClass || 'text-txt-primary'} transition-colors`}>{value}</span>
    </div>
  )
}

/* ── Collapsible Section ────────────────────────── */

function CollapsibleSection({ children, title, icon: Icon, color, defaultOpen = true, count }: {
  children: React.ReactNode
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  color: string
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="group/section">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 mb-3 cursor-pointer"
      >
        <span className={`w-6 h-6 ${color} text-white flex items-center justify-center rounded-lg shadow-sm transition-transform ${open ? '' : 'scale-95 opacity-80'}`}>
          <Icon size={12} />
        </span>
        <span className="text-xs font-bold text-txt-primary uppercase tracking-wide">{title}</span>
        {count != null && (
          <span className="text-[10px] font-mono text-txt-tertiary bg-surface-sunken px-1.5 py-0.5 rounded-full">{count}</span>
        )}
        <ChevronDown size={12} className={`ml-auto text-txt-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-out overflow-hidden ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </section>
  )
}

/* ── Skill Tag ──────────────────────────────────── */

function SkillTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-white text-txt-primary hover:border-border-strong hover:shadow-sm hover:-translate-y-0.5 transition-all select-none">
      {name}
    </span>
  )
}

/* ── Main Component ─────────────────────────────── */

export function ProfileBodyRight({
  personality,
  teamPref,
  availability,
  skills,
}: {
  personality: Record<string, number> | null
  workStyle?: Record<string, number> | undefined
  traits?: Record<string, unknown> | undefined
  teamPref?: Record<string, string> | undefined
  availability?: { hours_per_week?: number; prefer_online?: boolean } | undefined
  skills: Array<{ name: string }> | null
}) {
  const hasPersonality = personality && Object.keys(personality).length > 0
  const hasTeamPref = teamPref && (teamPref.preferred_size || teamPref.atmosphere)
  const hasAvailability = availability && availability.hours_per_week != null
  const hasSkills = skills && skills.length > 0

  const isEmpty = !hasPersonality && !hasTeamPref && !hasAvailability && !hasSkills

  return (
    <div className="md:col-span-2 space-y-4 md:bg-white/60 md:border md:border-border md:rounded-xl md:p-5 md:self-start">
      {/* Empty state */}
      {isEmpty && (
        <div className="px-4 py-10 border border-border bg-white text-center rounded-xl">
          <Sparkles size={20} className="mx-auto text-txt-disabled mb-2" />
          <p className="text-xs text-txt-tertiary font-medium">아직 등록된 성향·스킬 정보가 없습니다</p>
        </div>
      )}

      {/* ── Personality Traits ── */}
      {hasPersonality && (
        <CollapsibleSection title="성향 분석" icon={Brain} color="bg-violet-500" count={Object.keys(personality!).length}>
          <div className="space-y-1">
            {traitLabels.map(({ key, label, low, high }) => {
              const val = personality![key]
              if (val == null) return null
              return <SliderBar key={key} value={val} low={low} high={high} label={label} colorKey={key} />
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Team Preference ── */}
      {hasTeamPref && (
        <CollapsibleSection title="팀 선호" icon={Users} color="bg-emerald-500">
          <div className="space-y-1.5">
            {teamPref!.preferred_size && <TraitBadge label="선호 규모" value={teamPref!.preferred_size} colorClass="text-emerald-600" />}
            {teamPref!.atmosphere && <TraitBadge label="분위기" value={teamPref!.atmosphere} colorClass="text-emerald-600" />}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Availability ── */}
      {hasAvailability && (
        <CollapsibleSection title="가용 시간" icon={Clock} color="bg-amber-500">
          <div className="space-y-1.5">
            <TraitBadge label="주당 시간" value={`${availability!.hours_per_week}시간`} colorClass="text-amber-600" />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Skills ── */}
      {hasSkills && (
        <section>
          <SectionHeader icon={Code2} label="기술 스택" color="bg-neutral-800" count={skills!.length} />
          <div className="flex flex-wrap gap-1.5">
            {skills!.map((skill) => (
              <SkillTag key={skill.name} name={skill.name} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
