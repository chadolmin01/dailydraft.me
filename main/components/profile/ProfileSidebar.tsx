'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit3,
  Check,
  X,
  Globe,
  Github,
  Linkedin,
  Pencil,
  Loader2,
} from 'lucide-react'
import { useUpdateProfile } from '@/src/hooks/useProfile'
import type { Profile } from './types'

/* ── Link inline field ──────────────────────────────────── */

function LinkField({
  value,
  draft,
  placeholder,
  icon: Icon,
  label,
  onEdit,
}: {
  value: string
  draft: string | undefined
  placeholder: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  onEdit: (val: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const display = draft ?? value
  const isChanged = draft !== undefined && draft !== value

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus()
      ref.current.select()
    }
  }, [editing])

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 border border-border-strong">
        <Icon size={13} className="text-txt-tertiary shrink-0" />
        <input
          ref={ref}
          value={display}
          onChange={(e) => onEdit(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditing(false) }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent outline-none text-xs text-txt-primary placeholder:text-txt-disabled"
        />
      </div>
    )
  }

  if (display) {
    return (
      <div
        className="group/link flex items-center gap-2.5 px-2 py-1.5 text-xs text-txt-secondary hover:bg-surface-sunken hover:text-txt-primary transition-colors border border-transparent hover:border-border cursor-pointer"
        onClick={() => setEditing(true)}
        title="클릭하여 수정"
      >
        <Icon size={13} className="text-txt-tertiary" />
        <span className={`flex-1 truncate ${isChanged ? 'text-brand' : ''}`}>{display}</span>
        <Pencil size={9} className="opacity-0 group-hover/link:opacity-40 transition-opacity shrink-0" />
      </div>
    )
  }

  return (
    <div
      className="group/link flex items-center gap-2.5 px-2 py-1.5 text-xs text-txt-disabled hover:bg-surface-sunken hover:text-txt-tertiary transition-colors border border-dashed border-border cursor-pointer"
      onClick={() => setEditing(true)}
      title="클릭하여 추가"
    >
      <Icon size={13} />
      <span className="flex-1 italic">{label} 추가</span>
      <Pencil size={9} className="opacity-0 group-hover/link:opacity-40 transition-opacity shrink-0" />
    </div>
  )
}

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
}

export function ProfileSidebar({ profile, completion, isEditable = false }: ProfileSidebarProps) {
  const router = useRouter()
  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const updateProfile = useUpdateProfile()

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  useEffect(() => { setDrafts({}) }, [profile])

  const hasPendingChanges = useMemo(() => {
    return Object.entries(drafts).some(([field, val]) => {
      const original =
        field === 'portfolio_url' ? (profile?.portfolio_url || '') :
        field === 'github_url' ? (profile?.github_url || '') :
        field === 'linkedin_url' ? (profile?.linkedin_url || '') : ''
      return val !== original
    })
  }, [drafts, profile])

  const editField = (field: string) => (val: string) => {
    setDrafts(prev => ({ ...prev, [field]: val }))
  }

  const handleSave = () => {
    if (!hasPendingChanges) return
    const updates: Record<string, string | null> = {}
    for (const [field, val] of Object.entries(drafts)) {
      const trimmed = val.trim()
      const original =
        field === 'portfolio_url' ? (profile?.portfolio_url || '') :
        field === 'github_url' ? (profile?.github_url || '') :
        field === 'linkedin_url' ? (profile?.linkedin_url || '') : ''
      if (trimmed !== original) {
        updates[field] = trimmed || null
      }
    }
    if (Object.keys(updates).length > 0) {
      updateProfile.mutate(updates)
    }
  }

  const handleCancel = () => setDrafts({})

  const hasAnyLink = profile?.portfolio_url || profile?.github_url || profile?.linkedin_url
  const showLinksSection = isEditable || hasAnyLink

  return (
    <div className="space-y-4">
      {/* --- 프로필 설정 버튼 --- */}
      <button
        onClick={() => router.push('/profile/edit')}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold border border-border-strong hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] bg-surface-card"
      >
        <Edit3 size={12} /> 프로필 설정
      </button>

      {/* --- SOCIAL LINKS --- */}
      {showLinksSection && (
        <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
          <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold">L</span>
            LINKS
          </h3>
          <div className="space-y-1.5">
            {isEditable ? (
              <>
                <LinkField value={profile?.portfolio_url || ''} draft={drafts.portfolio_url} placeholder="https://portfolio.com" icon={Globe} label="Portfolio" onEdit={editField('portfolio_url')} />
                <LinkField value={profile?.github_url || ''} draft={drafts.github_url} placeholder="https://github.com/username" icon={Github} label="GitHub" onEdit={editField('github_url')} />
                <LinkField value={profile?.linkedin_url || ''} draft={drafts.linkedin_url} placeholder="https://linkedin.com/in/username" icon={Linkedin} label="LinkedIn" onEdit={editField('linkedin_url')} />
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
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border">
              <button onClick={handleCancel} disabled={updateProfile.isPending} className="flex items-center gap-1 px-2.5 py-1 text-[0.625rem] font-bold text-txt-secondary border border-border-strong hover:bg-surface-sunken transition-colors">
                <X size={10} /> 취소
              </button>
              <button onClick={handleSave} disabled={updateProfile.isPending} className="flex items-center gap-1 px-3 py-1 text-[0.625rem] font-bold bg-surface-inverse text-txt-inverse border border-surface-inverse hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97] disabled:opacity-50">
                {updateProfile.isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                저장
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TECH STACK --- */}
      {skills && skills.length > 0 && (
        <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
          <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[0.5rem] font-bold">S</span>
            TECH STACK
          </h3>
          <div className="space-y-1.5">
            {skills.map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between py-1 border-b border-dashed border-border last:border-0">
                <span className="flex items-center gap-2 text-xs text-txt-secondary">
                  <span className="text-[0.625rem] font-mono text-txt-tertiary">{String(idx + 1).padStart(2, '0')}</span>
                  {skill.name}
                </span>
                <span className="text-[0.625rem] font-mono font-bold bg-brand-bg text-brand border border-brand-border px-1.5 py-0.5">{skill.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PERSONALITY --- */}
      {profile?.personality && (
        <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
          <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-indicator-premium text-white flex items-center justify-center text-[0.5rem] font-bold">P</span>
            PERSONALITY
          </h3>
          <div className="space-y-2">
            {Object.entries(profile.personality as Record<string, number>).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-[0.625rem] text-txt-secondary">{key.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-surface-sunken border border-border overflow-hidden">
                    <div className="h-full bg-brand transition-all" style={{ width: `${(value / 10) * 100}%` }} />
                  </div>
                  <span className="text-[0.625rem] font-mono text-txt-tertiary w-8 text-right">{value}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- COMPLETION --- */}
      <div className="relative bg-surface-card border border-border-strong p-4 shadow-sharp">
        <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b border-surface-inverse/20" />
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-surface-inverse/20" />
        <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
          <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[0.5rem] font-bold">%</span>
          COMPLETION
        </h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-mono font-bold text-txt-primary">{completion.pct}%</span>
          <span className="text-[0.625rem] font-mono text-txt-tertiary">{completion.completedCount}/{completion.fields.length} FIELDS</span>
        </div>
        <div className="w-full h-2 bg-surface-sunken border border-border overflow-hidden mb-3">
          <div className="h-full bg-indicator-online transition-all" style={{ width: `${completion.pct}%` }} />
        </div>
        <div className="space-y-1">
          {completion.fields.map((f, idx) => (
            <div key={f.label} className="flex items-center gap-2 text-xs py-0.5">
              <span className="text-[0.625rem] font-mono text-txt-tertiary w-4">{String(idx + 1).padStart(2, '0')}</span>
              {f.done ? (
                <span className="w-3.5 h-3.5 bg-indicator-online text-white flex items-center justify-center"><Check size={10} /></span>
              ) : (
                <span className="w-3.5 h-3.5 border border-border-strong" />
              )}
              <span className={f.done ? 'text-txt-tertiary line-through font-mono text-[0.625rem]' : 'text-txt-secondary font-mono text-[0.625rem]'}>{f.label}</span>
            </div>
          ))}
        </div>
        {completion.pct < 100 && (
          <button
            onClick={() => router.push('/profile/edit')}
            className="w-full mt-3 px-3 py-2 text-xs font-bold bg-brand text-white border border-brand hover:bg-brand-hover transition-colors hover:opacity-90 active:scale-[0.97]"
          >
            프로필 완성하기
          </button>
        )}
      </div>
    </div>
  )
}
