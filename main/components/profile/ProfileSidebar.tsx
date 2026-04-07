'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  Globe,
  Github,
  Linkedin,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react'
import { useProfileDraft } from '@/src/hooks/useProfileDraft'
import { useUpdateProfile } from '@/src/hooks/useProfile'
import { SKILL_SUGGESTIONS } from './edit/constants'
import type { Profile } from './types'
import { EditableField } from './EditableField'

/* ── ProfileSidebar ─────────────────────────────────────── */

interface ProfileSidebarProps {
  profile: Profile
  email: string | undefined
  completion: {
    fields: { label: string; done: boolean }[]
    completedCount: number
    pct: number
  }
  isEditable?: boolean
}

export function ProfileSidebar({ profile, completion, isEditable = false }: ProfileSidebarProps) {
  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const updateProfile = useUpdateProfile()

  const [showSkillInput, setShowSkillInput] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')

  const sidebarDefaults = useMemo(() => ({
    portfolio_url: profile?.portfolio_url || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
  }), [profile])

  const { drafts, hasPendingChanges, isPending, editField, handleSave, handleCancel } = useProfileDraft(
    profile, sidebarDefaults
  )

  const hasAnyLink = profile?.portfolio_url || profile?.github_url || profile?.linkedin_url
  const showLinksSection = isEditable || hasAnyLink

  const addSkill = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const current = (skills || []).map(s => ({ name: s.name }))
    if (current.some(s => s.name === trimmed)) return
    const updated = [...current, { name: trimmed }]
    updateProfile.mutate({ skills: updated as any })
    setNewSkillName('')
  }

  const removeSkill = (name: string) => {
    const updated = (skills || []).filter(s => s.name !== name).map(s => ({ name: s.name }))
    updateProfile.mutate({ skills: updated as any })
  }

  return (
    <div className="space-y-4">

      {/* ── Links ── */}
      {showLinksSection && (
        <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-semibold text-txt-secondary mb-3">링크</p>
          <div className="space-y-1">
            {isEditable ? (
              <>
                <EditableField variant="link" value={profile?.portfolio_url || ''} draft={drafts.portfolio_url} placeholder="https://portfolio.com" icon={Globe} label="Portfolio" onEdit={editField('portfolio_url')} />
                <EditableField variant="link" value={profile?.github_url || ''} draft={drafts.github_url} placeholder="https://github.com/username" icon={Github} label="GitHub" onEdit={editField('github_url')} />
                <EditableField variant="link" value={profile?.linkedin_url || ''} draft={drafts.linkedin_url} placeholder="https://linkedin.com/in/username" icon={Linkedin} label="LinkedIn" onEdit={editField('linkedin_url')} />
              </>
            ) : (
              <>
                {profile?.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors rounded-lg">
                    <Globe size={13} className="text-txt-tertiary" /> Portfolio
                  </a>
                )}
                {profile?.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors rounded-lg">
                    <Github size={13} className="text-txt-tertiary" /> GitHub
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors rounded-lg">
                    <Linkedin size={13} className="text-txt-tertiary" /> LinkedIn
                  </a>
                )}
              </>
            )}
          </div>
          {isEditable && hasPendingChanges && (
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border/40">
              <button onClick={handleCancel} disabled={isPending} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-txt-secondary border border-border hover:bg-surface-sunken transition-colors rounded-xl">
                <X size={10} /> 취소
              </button>
              <button onClick={handleSave} disabled={isPending} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 rounded-xl">
                {isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                저장
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tech Stack ── */}
      {(isEditable || (skills && skills.length > 0)) && (
        <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-5">
          <p className="text-xs font-semibold text-txt-secondary mb-3">기술 스택</p>
          <div className="flex flex-wrap gap-1.5">
            {(skills || []).map((skill, idx) => (
              <span key={idx} className="text-xs px-2.5 py-1 font-medium rounded-full inline-flex items-center gap-1 transition-all bg-brand/8 text-brand border border-brand/20">
                {skill.name}
                {isEditable && showSkillInput && (
                  <button onClick={() => removeSkill(skill.name)} className="hover:text-status-danger-text transition-colors p-0.5 -mr-0.5">
                    <X size={8} />
                  </button>
                )}
              </span>
            ))}
            {isEditable && !showSkillInput && (
              <button
                onClick={() => setShowSkillInput(true)}
                className="text-xs text-txt-tertiary border border-dashed border-border/80 px-2.5 py-1 font-medium rounded-full hover:border-brand hover:text-brand transition-colors inline-flex items-center gap-0.5"
              >
                <Plus size={8} /> 추가
              </button>
            )}
          </div>
          {isEditable && showSkillInput && (
            <div className="mt-3 space-y-2.5">
              <p className="text-[11px] text-txt-tertiary">탭하여 추가 · 태그의 X로 제거</p>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter(s => !(skills || []).some(sk => sk.name === s)).map(s => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="text-xs px-2.5 py-1 border border-border bg-surface-sunken text-txt-secondary rounded-full hover:border-brand hover:text-brand transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkillName) } }}
                  placeholder="직접 입력"
                  maxLength={30}
                  className="flex-1 px-3 py-1.5 text-xs border border-border bg-surface-card rounded-lg focus:outline-none focus:border-brand transition-colors"
                />
                <button onClick={() => addSkill(newSkillName)} className="px-2.5 py-1.5 text-xs border border-border text-txt-secondary hover:bg-surface-sunken transition-colors rounded-lg">
                  <Plus size={12} />
                </button>
              </div>
              <button
                onClick={() => { setShowSkillInput(false); setNewSkillName('') }}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 active:scale-[0.97] transition-all"
              >
                <Check size={10} /> 완료
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Personality ── */}
      {profile?.personality && (() => {
        const p = profile.personality as Record<string, number>
        const traits: { key: string; label: string; low: string; high: string }[] = [
          { key: 'communication', label: '소통', low: '비동기', high: '실시간' },
          { key: 'risk', label: '도전', low: '안정', high: '모험' },
          { key: 'planning', label: '작업', low: '유연', high: '체계' },
          { key: 'quality', label: '품질', low: '속도', high: '완성도' },
        ]

        return (
          <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-5">
            <p className="text-xs font-semibold text-txt-secondary mb-4 flex items-center gap-1.5">
              <Sparkles size={10} /> 성향 분석
            </p>
            <div className="space-y-3">
              {traits.map(({ key, label, low, high }) => {
                const raw = p[key]
                if (raw == null) return null
                const value = Math.min(raw, 5)
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-txt-secondary">{label}</span>
                    </div>
                    <div className="relative">
                      <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${(value / 5) * 100}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-txt-disabled">{low}</span>
                        <span className="text-[9px] text-txt-disabled">{high}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {isEditable && (
              <Link
                href="/onboarding?mode=redo-chat"
                className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/40 text-xs font-semibold text-txt-tertiary hover:text-brand transition-colors"
              >
                <Sparkles size={10} /> AI 온보딩 다시하기 →
              </Link>
            )}
          </div>
        )
      })()}

      {/* ── Completion ── */}
      <div className="bg-surface-card rounded-2xl border border-border shadow-sm p-5">
        <p className="text-xs font-semibold text-txt-secondary mb-3">프로필 완성도</p>
        <div className="flex items-end justify-between mb-2.5">
          <span className="text-2xl font-bold text-txt-primary tracking-tight">{completion.pct}%</span>
          <span className="text-[11px] text-txt-tertiary">{completion.completedCount}/{completion.fields.length}</span>
        </div>
        <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completion.pct}%`,
              background: completion.pct === 100
                ? 'var(--indicator-online)'
                : 'var(--brand)',
            }}
          />
        </div>
        <div className="space-y-1.5">
          {completion.fields.map((f) => (
            <div key={f.label} className="flex items-center gap-2.5 text-xs py-0.5">
              {f.done ? (
                <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center rounded-full shrink-0"><Check size={9} /></span>
              ) : (
                <span className="w-4 h-4 border border-border rounded-full shrink-0" />
              )}
              <span className={f.done ? 'text-txt-tertiary line-through' : 'text-txt-secondary'}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
