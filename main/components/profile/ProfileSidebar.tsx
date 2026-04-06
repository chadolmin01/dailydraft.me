'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Edit3,
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
  uniVerified: boolean
  completion: {
    fields: { label: string; done: boolean }[]
    completedCount: number
    pct: number
  }
  isEditable?: boolean
  onOpenEditPanel?: () => void
}

export function ProfileSidebar({ profile, completion, isEditable = false, onOpenEditPanel }: ProfileSidebarProps) {
  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const updateProfile = useUpdateProfile()

  // Inline skill editing state
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
      {/* --- 프로필 설정 버튼 --- */}
      <button
        onClick={onOpenEditPanel}
        className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold border border-border hover:bg-black hover:text-white transition-colors hover:shadow-md active:scale-[0.97] bg-surface-card rounded-xl"
      >
        <Edit3 size={14} /> 프로필 설정
      </button>

      {/* --- SOCIAL LINKS --- */}
      {showLinksSection && (
        <div className="relative bg-surface-card rounded-xl shadow-sm p-5">
          <h3 className="text-[11px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-brand text-white flex items-center justify-center text-[10px] font-bold rounded">L</span>
            LINKS
          </h3>
          <div className="space-y-1.5">
            {isEditable ? (
              <>
                <EditableField variant="link" value={profile?.portfolio_url || ''} draft={drafts.portfolio_url} placeholder="https://portfolio.com" icon={Globe} label="Portfolio" onEdit={editField('portfolio_url')} />
                <EditableField variant="link" value={profile?.github_url || ''} draft={drafts.github_url} placeholder="https://github.com/username" icon={Github} label="GitHub" onEdit={editField('github_url')} />
                <EditableField variant="link" value={profile?.linkedin_url || ''} draft={drafts.linkedin_url} placeholder="https://linkedin.com/in/username" icon={Linkedin} label="LinkedIn" onEdit={editField('linkedin_url')} />
              </>
            ) : (
              <>
                {profile?.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors border border-transparent hover:border-border">
                    <Globe size={13} className="text-txt-tertiary" /> Portfolio
                  </a>
                )}
                {profile?.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors border border-transparent hover:border-border">
                    <Github size={13} className="text-txt-tertiary" /> GitHub
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors border border-transparent hover:border-border">
                    <Linkedin size={13} className="text-txt-tertiary" /> LinkedIn
                  </a>
                )}
              </>
            )}
          </div>
          {isEditable && hasPendingChanges && (
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border/40">
              <button onClick={handleCancel} disabled={isPending} className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-txt-secondary border border-border hover:bg-surface-sunken transition-colors rounded-xl">
                <X size={10} /> 취소
              </button>
              <button onClick={handleSave} disabled={isPending} className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50 rounded-xl">
                {isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                저장
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TECH STACK --- */}
      {(isEditable || (skills && skills.length > 0)) && (
        <div className="relative bg-surface-card rounded-xl shadow-sm p-5">
          <h3 className="text-[11px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[10px] font-bold rounded">S</span>
            TECH STACK
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(skills || []).map((skill, idx) => (
              <span key={idx} className="text-[10px] font-mono px-2 py-0.5 font-medium rounded-full inline-flex items-center gap-1 transition-all bg-brand/10 text-brand border border-brand/30">
                {skill.name}
                {isEditable && showSkillInput && (
                  <button
                    onClick={() => removeSkill(skill.name)}
                    className="hover:text-status-danger-text transition-colors p-0.5 -mr-0.5"
                  >
                    <X size={8} />
                  </button>
                )}
              </span>
            ))}
            {isEditable && !showSkillInput && (
              <button
                onClick={() => setShowSkillInput(true)}
                className="text-[10px] font-mono text-txt-tertiary border border-dashed border-border px-2 py-0.5 font-medium rounded-full hover:border-brand hover:text-brand transition-colors inline-flex items-center gap-0.5"
              >
                <Plus size={8} /> 추가
              </button>
            )}
          </div>
          {isEditable && showSkillInput && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] text-txt-tertiary">탭하여 추가 / 위 태그의 X로 제거</p>
              <div className="flex flex-wrap gap-1">
                {SKILL_SUGGESTIONS.filter(s => !(skills || []).some(sk => sk.name === s)).map(s => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="text-[10px] font-mono px-2 py-0.5 border border-border bg-surface-sunken text-txt-secondary rounded-full hover:border-brand hover:text-brand transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkillName) } }}
                  placeholder="직접 입력"
                  maxLength={30}
                  className="flex-1 px-2 py-1 text-xs border border-border bg-surface-card rounded-lg focus:outline-none focus:border-brand transition-colors"
                />
                <button
                  onClick={() => addSkill(newSkillName)}
                  className="px-2 py-1 text-xs border border-border text-txt-secondary hover:bg-surface-sunken transition-colors rounded-lg"
                >
                  <Plus size={12} />
                </button>
              </div>
              <button
                onClick={() => { setShowSkillInput(false); setNewSkillName('') }}
                className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-[11px] font-bold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 active:scale-[0.97] transition-all"
              >
                <Check size={10} /> 완료
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- PERSONALITY --- */}
      {profile?.personality && (() => {
        const p = profile.personality as Record<string, number>
        const traits: { key: string; label: string }[] = [
          { key: 'communication', label: '소통 스타일' },
          { key: 'risk', label: '도전 성향' },
          { key: 'planning', label: '작업 방식' },
          { key: 'quality', label: '완성도 vs 속도' },
        ]

        return (
          <div className="relative bg-surface-card rounded-xl shadow-sm p-5">
            <h3 className="text-[11px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
              <span className="w-4 h-4 bg-indicator-premium text-white flex items-center justify-center text-[10px] font-bold rounded">P</span>
              PERSONALITY
            </h3>
            <div className="space-y-2">
              {traits.map(({ key, label }) => {
                const raw = p[key]
                if (raw == null) return null
                const value = Math.min(raw, 5)
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[11px] text-txt-secondary">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-sunken rounded-xl border border-border overflow-hidden">
                        <div className="h-full bg-brand transition-all" style={{ width: `${(value / 5) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-txt-tertiary w-8 text-right">{value}/5</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {isEditable && (
              <Link
                href="/onboarding?mode=redo-chat"
                className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40 text-[11px] font-bold text-txt-tertiary hover:text-brand transition-colors"
              >
                <Sparkles size={10} /> AI 온보딩 다시하기 →
              </Link>
            )}
          </div>
        )
      })()}

      {/* --- COMPLETION --- */}
      <div className="relative bg-surface-card rounded-xl shadow-sm p-5">
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[10px] font-bold rounded">%</span>
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
                <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center rounded"><Check size={10} /></span>
              ) : (
                <span className="w-4 h-4 border border-border rounded" />
              )}
              <span className={f.done ? 'text-txt-tertiary line-through font-mono text-[10px]' : 'text-txt-secondary font-mono text-[11px]'}>{f.label}</span>
            </div>
          ))}
        </div>
        {completion.pct < 100 && (
          <button
            onClick={onOpenEditPanel}
            className="w-full mt-3 px-3 py-2 text-xs font-bold bg-brand text-white border border-brand hover:bg-brand-hover transition-colors hover:opacity-90 active:scale-[0.97] rounded-xl"
          >
            프로필 완성하기
          </button>
        )}
      </div>
    </div>
  )
}
