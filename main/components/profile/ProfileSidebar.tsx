'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit3,
  Check,
  X,
  Globe,
  Github,
  Linkedin,
  Loader2,
} from 'lucide-react'
import { useProfileDraft } from '@/src/hooks/useProfileDraft'
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
}

export function ProfileSidebar({ profile, completion, isEditable = false }: ProfileSidebarProps) {
  const router = useRouter()
  const skills = profile?.skills as Array<{ name: string; level: string }> | null

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

  return (
    <div className="space-y-4">
      {/* --- 프로필 설정 버튼 --- */}
      <button
        onClick={() => router.push('/profile/edit')}
        className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm font-bold border border-border hover:bg-black hover:text-white transition-colors hover:shadow-md active:scale-[0.97] bg-surface-card rounded-xl"
      >
        <Edit3 size={14} /> 프로필 설정
      </button>


      {/* --- SOCIAL LINKS --- */}
      {showLinksSection && (
        <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
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
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border">
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
      {skills && skills.length > 0 && (
        <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
          <h3 className="text-[11px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <span className="w-4 h-4 bg-indicator-online text-white flex items-center justify-center text-[10px] font-bold rounded">S</span>
            TECH STACK
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, idx) => (
              <span key={idx} className="text-[10px] font-mono bg-surface-sunken text-txt-primary border border-border px-2 py-0.5 font-medium rounded-full">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* --- PERSONALITY --- */}
      {profile?.personality && (() => {
        const p = profile.personality as Record<string, number>
        const traits: { key: string; label: string }[] = [
          { key: 'communication', label: '소통 스타일' },
          { key: 'teamRole', label: '팀 역할' },
          { key: 'risk', label: '도전 성향' },
          { key: 'planning', label: '작업 방식' },
          { key: 'quality', label: '완성도 vs 속도' },
          { key: 'time', label: '시간 투자' },
        ]

        return (
          <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
            <h3 className="text-[11px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
              <span className="w-4 h-4 bg-indicator-premium text-white flex items-center justify-center text-[10px] font-bold rounded">P</span>
              PERSONALITY
            </h3>
            <div className="space-y-2">
              {traits.map(({ key, label }) => {
                const raw = p[key]
                if (raw == null) return null
                const value = raw > 5 ? Math.round(raw / 2) : raw
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
          </div>
        )
      })()}

      {/* --- COMPLETION --- */}
      <div className="relative bg-surface-card rounded-xl border border-border p-4 shadow-md">
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
