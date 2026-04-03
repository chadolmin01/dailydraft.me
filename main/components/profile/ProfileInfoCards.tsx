'use client'

import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { CATEGORICAL_LABELS, SCORE_TO_CATEGORICAL } from '@/src/lib/onboarding/constants'
import type { Profile } from './types'

/* ── ProfileInfoCards ─────────────────────────────────────── */

interface ProfileInfoCardsProps {
  profile: Profile
  completion: {
    fields: { label: string; done: boolean }[]
    completedCount: number
    pct: number
  }
  isEditable?: boolean
}

export function ProfileInfoCards({ profile, completion, isEditable = false }: ProfileInfoCardsProps) {
  const router = useRouter()
  const skills = profile?.skills as Array<{ name: string; level: string }> | null

  /* ── Personality data ── */
  const personalityData = (() => {
    if (!profile?.personality) return null
    const p = profile.personality as Record<string, number>
    let visionTraits: Record<string, unknown> | undefined
    try {
      const vs = profile.vision_summary ? JSON.parse(profile.vision_summary as string) : null
      visionTraits = vs?.traits as Record<string, unknown> | undefined
    } catch { /* skip */ }
    const decisionCatId = (visionTraits?.decision_style as string) || (p.decision != null ? SCORE_TO_CATEGORICAL.decision_style(p.decision) : undefined)
    const decisionLabel = decisionCatId ? CATEGORICAL_LABELS.decision_style?.[decisionCatId] : undefined
    return { p, decisionLabel }
  })()

  const hasSkills = skills && skills.length > 0
  const hasPersonality = !!personalityData

  // Don't render if nothing to show
  if (!hasSkills && !hasPersonality && completion.pct === 100 && !isEditable) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* --- TECH STACK --- */}
      {hasSkills && (
        <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[0.5rem] font-bold rounded">S</span>
            TECH STACK
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skills!.map((skill, idx) => (
              <span key={idx} className="text-[10px] font-mono bg-surface-sunken text-txt-primary border border-border px-2 py-0.5 font-medium rounded-full">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* --- PERSONALITY --- */}
      {hasPersonality && (
        <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-indicator-premium text-white flex items-center justify-center text-[0.5rem] font-bold rounded">P</span>
            PERSONALITY
          </h3>
          <div className="space-y-2">
            {personalityData!.decisionLabel && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-txt-secondary">의사결정</span>
                <span className="text-xs font-semibold text-txt-primary">{personalityData!.decisionLabel}</span>
              </div>
            )}
            {(['communication', 'risk', 'time'] as const).map(key => {
              const value = personalityData!.p[key]
              if (value == null) return null
              const labels: Record<string, string> = { risk: '도전 성향', time: '시간 투자', communication: '소통 선호' }
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-[10px] text-txt-secondary">{labels[key]}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-surface-sunken rounded-xl border border-border overflow-hidden">
                      <div className="h-full bg-brand transition-all" style={{ width: `${(value / 10) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-txt-tertiary w-8 text-right">{value}/10</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* --- COMPLETION --- */}
      <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[0.5rem] font-bold rounded">%</span>
          COMPLETION
        </h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-mono font-bold text-txt-primary">{completion.pct}%</span>
          <span className="text-[10px] font-mono text-txt-tertiary">{completion.completedCount}/{completion.fields.length} FIELDS</span>
        </div>
        <div className="w-full h-2 bg-surface-sunken rounded-xl border border-border overflow-hidden mb-3">
          <div className="h-full bg-indicator-online transition-all" style={{ width: `${completion.pct}%` }} />
        </div>
        <div className="space-y-1">
          {completion.fields.map((f, idx) => (
            <div key={f.label} className="flex items-center gap-2 text-xs py-0.5">
              <span className="text-[10px] font-mono text-txt-tertiary w-4">{String(idx + 1).padStart(2, '0')}</span>
              {f.done ? (
                <span className="w-3.5 h-3.5 bg-indicator-online text-white flex items-center justify-center rounded"><Check size={10} /></span>
              ) : (
                <span className="w-3.5 h-3.5 border border-border rounded" />
              )}
              <span className={f.done ? 'text-txt-tertiary line-through font-mono text-[10px]' : 'text-txt-secondary font-mono text-[10px]'}>{f.label}</span>
            </div>
          ))}
        </div>
        {completion.pct < 100 && (
          <button
            onClick={() => router.push('/profile/edit')}
            className="w-full mt-3 px-3 py-2 text-xs font-bold bg-brand text-white border border-brand hover:bg-brand-hover transition-colors hover:opacity-90 active:scale-[0.97] rounded-xl"
          >
            프로필 완성하기
          </button>
        )}
      </div>
    </div>
  )
}
