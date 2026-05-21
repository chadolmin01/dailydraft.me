'use client'

import { useState } from 'react'
import { Code2, Clock, Users, Brain, ChevronDown, Sparkles } from 'lucide-react'
import { SliderBar } from './SliderBar'
import { traitLabels } from './types'

/* ── Collapsible Section ────────────────────────── */

function CollapsibleSection({ children, title, icon: Icon, defaultOpen = true, count }: {
  children: React.ReactNode
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 mb-3 cursor-pointer"
      >
        <span className="w-8 h-8 bg-border-subtle text-txt-secondary flex items-center justify-center rounded-xl">
          <Icon size={15} />
        </span>
        <span className="text-[15px] font-bold text-txt-primary">{title}</span>
        {count != null && (
          <span className="text-xs font-semibold text-brand">{count}</span>
        )}
        <ChevronDown size={14} className={`ml-auto text-txt-tertiary transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 ease-out overflow-hidden ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </section>
  )
}

/* ── Trait Badge ──────────────────────────────────── */

function TraitBadge({ label, value }: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-surface-sunken rounded-2xl">
      <span className="text-[13px] text-txt-secondary font-medium">{label}</span>
      <span className="text-[13px] font-bold text-txt-primary">{value}</span>
    </div>
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
  const hasAvailability = availability && availability.hours_per_week != null
  const hasSkills = skills && skills.length > 0

  const isEmpty = !hasPersonality && !hasAvailability && !hasSkills

  return (
    <div className="md:col-span-2 space-y-4 md:bg-surface-sunken md:rounded-2xl md:p-5 md:self-start">
      {/* Empty state */}
      {isEmpty && (
        <div className="px-4 py-10 bg-surface-sunken text-center rounded-2xl">
          <Sparkles size={20} className="mx-auto text-txt-disabled mb-2" />
          <p className="text-[13px] text-txt-tertiary font-medium">아직 등록된 성향·스킬 정보가 없습니다</p>
        </div>
      )}

      {/* ── Personality Traits ── */}
      {hasPersonality && (
        <CollapsibleSection title="성향 분석" icon={Brain}>
          <div className="space-y-1">
            {traitLabels.map(({ key, label, low, high }) => {
              const val = personality![key]
              if (val == null) return null
              return <SliderBar key={key} value={val} low={low} high={high} label={label} colorKey={key} />
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Availability ── */}
      {hasAvailability && (
        <CollapsibleSection title="가용 시간" icon={Clock}>
          <div className="space-y-2">
            <TraitBadge label="주당 시간" value={`${availability!.hours_per_week}시간`} />
          </div>
        </CollapsibleSection>
      )}

      {/* ── Skills ── */}
      {hasSkills && (
        <section>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 bg-border-subtle text-txt-secondary flex items-center justify-center rounded-xl">
              <Code2 size={15} />
            </span>
            <span className="text-[15px] font-bold text-txt-primary">기술 스택</span>
            <span className="text-xs font-semibold text-brand">{skills!.length}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills!.map((skill) => (
              <span
                key={skill.name}
                className="px-3 py-1.5 text-[13px] font-medium rounded-full bg-border-subtle text-txt-primary hover:bg-border transition-colors"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
