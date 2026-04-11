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
  MessageCircle,
  Unlink,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useProfileDraft } from '@/src/hooks/useProfileDraft'
import { useUpdateProfile } from '@/src/hooks/useProfile'
import { useAuth } from '@/src/context/AuthContext'
import { withRetry } from '@/src/lib/query-utils'
import { SKILL_SUGGESTIONS } from './edit/constants'
import type { Profile } from './types'
import { EditableField } from './EditableField'

/* ── ProfileSidebar (now used as About tab content) ─── */

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

interface MyClub {
  slug: string; name: string; logo_url: string | null; category: string | null
  role: string; display_role: string | null; member_count: number
}

export function ProfileSidebar({ profile, completion, isEditable = false }: ProfileSidebarProps) {
  const { user } = useAuth()
  const skills = profile?.skills as Array<{ name: string; level: string }> | null
  const updateProfile = useUpdateProfile()

  const { data: myClubs = [] } = useQuery<MyClub[]>({
    queryKey: ['my-clubs'],
    queryFn: () => withRetry(async () => {
      const res = await fetch('/api/users/my-clubs')
      if (!res.ok) return []
      return res.json()
    }),
    enabled: isEditable && !!user,
    staleTime: 1000 * 60 * 2,
  })

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
    <div className="space-y-10">

      {/* ── 소속 클럽 ── */}
      {myClubs.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-txt-primary mb-3">소속 클럽</h3>
          <div className="space-y-2">
            {myClubs.map(club => (
              <Link
                key={club.slug}
                href={`/clubs/${club.slug}`}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-surface-sunken transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-bg-sunken flex items-center justify-center text-xs font-extrabold text-txt-secondary shrink-0">
                  {club.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-txt-primary truncate">{club.name}</span>
                    {club.category && (
                      <span className="text-[10px] font-medium text-brand bg-brand-bg px-1.5 py-0.5 rounded-full shrink-0">{club.category}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-txt-tertiary">멤버 {club.member_count}명</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Links ── */}
      {showLinksSection && (
        <section>
          <h3 className="text-sm font-bold text-txt-primary mb-3">링크</h3>
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
                  <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-2 text-sm text-brand hover:underline transition-colors">
                    <Globe size={14} className="text-txt-tertiary" /> {profile.portfolio_url}
                  </a>
                )}
                {profile?.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-2 text-sm text-brand hover:underline transition-colors">
                    <Github size={14} className="text-txt-tertiary" /> {profile.github_url}
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-2 py-2 text-sm text-brand hover:underline transition-colors">
                    <Linkedin size={14} className="text-txt-tertiary" /> {profile.linkedin_url}
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
        </section>
      )}

      {/* ── Discord 연결 ── */}
      {isEditable && (
        <section>
          <h3 className="text-sm font-bold text-txt-primary mb-3">Discord</h3>
          {profile?.discord_user_id ? (
            <div className="flex items-center gap-2.5 px-2 py-2 text-sm text-txt-secondary">
              <MessageCircle size={14} className="text-[#5865F2]" />
              <span className="flex-1 truncate">
                {(profile as any).discord_username || 'Discord 연결됨'}
              </span>
              <button
                onClick={async () => {
                  if (!confirm('Discord 연결을 해제하시겠습니까?')) return
                  updateProfile.mutate({ discord_user_id: null, discord_username: null } as any)
                }}
                className="text-txt-disabled hover:text-status-danger-text transition-colors"
                title="연결 해제"
              >
                <Unlink size={12} />
              </button>
            </div>
          ) : (
            <a
              href="/api/discord/oauth?returnTo=/profile"
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors"
            >
              <MessageCircle size={14} />
              Discord 계정 연결
            </a>
          )}
        </section>
      )}

      {/* ── Tech Stack ── */}
      {(isEditable || (skills && skills.length > 0)) && (
        <section>
          <h3 className="text-sm font-bold text-txt-primary mb-3">기술 스택</h3>
          <div className="flex flex-wrap gap-2">
            {(skills || []).map((skill, idx) => (
              <span key={idx} className="text-sm px-3 py-1.5 font-medium rounded-full inline-flex items-center gap-1 bg-surface-sunken text-txt-primary border border-border">
                {skill.name}
                {isEditable && showSkillInput && (
                  <button onClick={() => removeSkill(skill.name)} className="hover:text-status-danger-text transition-colors p-0.5 -mr-0.5">
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
            {isEditable && !showSkillInput && (
              <button
                onClick={() => setShowSkillInput(true)}
                className="text-sm text-txt-tertiary border border-dashed border-border px-3 py-1.5 font-medium rounded-full hover:border-txt-tertiary hover:text-txt-secondary transition-colors inline-flex items-center gap-1"
              >
                <Plus size={10} /> 추가
              </button>
            )}
          </div>
          {isEditable && showSkillInput && (
            <div className="mt-3 space-y-2.5">
              <p className="text-xs text-txt-tertiary">탭하여 추가 · 태그의 X로 제거</p>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter(s => !(skills || []).some(sk => sk.name === s)).map(s => (
                  <button
                    key={s}
                    onClick={() => addSkill(s)}
                    className="text-xs px-2.5 py-1 border border-border bg-surface-sunken text-txt-secondary rounded-full hover:border-txt-tertiary hover:text-txt-primary transition-colors"
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
                  className="flex-1 px-3 py-1.5 text-sm border border-border bg-surface-card rounded-lg focus:outline-none focus:border-brand transition-colors"
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
        </section>
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
          <section>
            <h3 className="text-sm font-bold text-txt-primary mb-4 flex items-center gap-1.5">
              성향 분석
            </h3>
            <div className="space-y-4">
              {traits.map(({ key, label, low, high }) => {
                const raw = p[key]
                if (raw == null) return null
                const value = Math.min(raw, 5)
                return (
                  <div key={key}>
                    <span className="text-xs font-medium text-txt-secondary">{label}</span>
                    <div className="mt-1.5">
                      <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-txt-primary rounded-full transition-all duration-500" style={{ width: `${(value / 5) * 100}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-txt-disabled">{low}</span>
                        <span className="text-[10px] text-txt-disabled">{high}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {isEditable && (
              <Link
                href="/onboarding?mode=redo-chat"
                className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border/40 text-xs font-semibold text-txt-tertiary hover:text-txt-primary transition-colors"
              >
                <Sparkles size={10} /> AI 온보딩 다시하기 →
              </Link>
            )}
          </section>
        )
      })()}

      {/* ── Completion ── */}
      {completion.pct < 100 && (
        <section>
          <h3 className="text-sm font-bold text-txt-primary mb-3">프로필 완성도</h3>
          <div className="flex items-end justify-between mb-2">
            <span className="text-lg font-bold text-txt-primary">{completion.pct}%</span>
            <span className="text-xs text-txt-tertiary">{completion.completedCount}/{completion.fields.length}</span>
          </div>
          <div className="w-full h-1.5 bg-surface-sunken rounded-full overflow-hidden mb-4">
            <div className="h-full bg-txt-primary rounded-full transition-all duration-500" style={{ width: `${completion.pct}%` }} />
          </div>
          <div className="space-y-1.5">
            {completion.fields.filter(f => !f.done).map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 text-xs py-0.5">
                <span className="w-4 h-4 border border-border rounded-full shrink-0" />
                <span className="text-txt-secondary">{f.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
