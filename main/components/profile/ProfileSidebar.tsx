'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Globe, Github, Linkedin, Mail, Plus, X, Loader2,
  Sparkles, GraduationCap, Check, Circle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useProfileDraft } from '@/src/hooks/useProfileDraft'
import { useUpdateProfile } from '@/src/hooks/useProfile'
import { useAuth } from '@/src/context/AuthContext'
import { withRetry } from '@/src/lib/query-utils'
import { SKILL_SUGGESTIONS } from './edit/constants'
import type { Profile } from './types'

/**
 * About 탭 — 스킬 · 링크 · 소속 클럽 · 완성도.
 * 섹션 단위 카드로 분리. 모든 스타일 디자인 토큰 기반.
 */

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
  slug: string
  name: string
  logo_url: string | null
  category: string | null
  role: string
  display_role: string | null
  member_count: number
}

export function ProfileSidebar({ profile, email, completion, isEditable = false }: ProfileSidebarProps) {
  const { user } = useAuth()
  const updateProfile = useUpdateProfile()
  const skills = (profile?.skills as Array<{ name: string; level: string }> | null) ?? []

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

  const defaults = useMemo(() => ({
    portfolio_url: profile?.portfolio_url || '',
    github_url: profile?.github_url || '',
    linkedin_url: profile?.linkedin_url || '',
    contact_email: profile?.contact_email || email || '',
  }), [profile, email])

  const { drafts, hasPendingChanges, isPending, editField, handleSave, handleCancel } = useProfileDraft(
    profile, defaults, {
      onSuccess: () => toast.success('저장되었습니다'),
      onError: () => toast.error('저장에 실패했습니다'),
    }
  )

  const [showSkillInput, setShowSkillInput] = useState(false)
  const [newSkill, setNewSkill] = useState('')

  const addSkill = () => {
    const name = newSkill.trim()
    if (!name) return
    if (skills.some(s => s.name === name)) { setNewSkill(''); return }
    updateProfile.mutate({ skills: [...skills, { name, level: 'intermediate' }] })
    setNewSkill('')
    setShowSkillInput(false)
  }

  const removeSkill = (name: string) => {
    updateProfile.mutate({ skills: skills.filter(s => s.name !== name) })
  }

  return (
    <div className="space-y-4">
      {/* 스킬 */}
      <Card title="스킬" icon={Sparkles}>
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => {
            // level 값: 'beginner' | 'intermediate' | 'advanced' | 'expert'. 이전엔 수집만 하고 표시 X.
            // 이모지 레벨 인디케이터로 시각화.
            const levelDots = s.level === 'expert' ? '●●●●'
              : s.level === 'advanced' ? '●●●○'
              : s.level === 'intermediate' ? '●●○○'
              : s.level === 'beginner' ? '●○○○' : ''
            const levelLabel = s.level === 'expert' ? '전문가'
              : s.level === 'advanced' ? '숙련'
              : s.level === 'intermediate' ? '중급'
              : s.level === 'beginner' ? '초급' : ''
            return (
              <span
                key={s.name}
                title={levelLabel ? `${s.name} · ${levelLabel}` : s.name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-sunken text-txt-secondary text-xs font-medium"
              >
                {s.name}
                {levelDots && (
                  <span className="text-[8px] font-mono text-brand tracking-[-1px]" aria-label={`레벨: ${levelLabel}`}>
                    {levelDots}
                  </span>
                )}
                {isEditable && (
                  <button
                    onClick={() => removeSkill(s.name)}
                    className="text-txt-disabled hover:text-status-danger-text transition-colors"
                    aria-label="스킬 제거"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            )
          })}
          {isEditable && (
            showSkillInput ? (
              <span className="inline-flex items-center gap-1">
                <input
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value.slice(0, 30))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
                    if (e.key === 'Escape') { setShowSkillInput(false); setNewSkill('') }
                  }}
                  placeholder="예: React, Figma, Python"
                  aria-label="새로 추가할 스킬"
                  autoFocus
                  list="skill-suggestions"
                  className="w-24 px-2.5 py-1 text-xs bg-surface-sunken border border-border rounded-full outline-none focus:ring-2 focus:ring-brand/40"
                />
                <datalist id="skill-suggestions">
                  {SKILL_SUGGESTIONS?.map((s: string) => <option key={s} value={s} />)}
                </datalist>
                <button
                  onClick={addSkill}
                  disabled={!newSkill.trim()}
                  className="text-brand hover:text-brand-hover disabled:text-txt-disabled transition-colors"
                  aria-label="추가"
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => { setShowSkillInput(false); setNewSkill('') }}
                  className="text-txt-disabled hover:text-txt-tertiary transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ) : (
              <button
                onClick={() => setShowSkillInput(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-sunken text-txt-tertiary text-xs font-medium hover:bg-border-subtle transition-colors"
              >
                <Plus size={10} />
                스킬 추가
              </button>
            )
          )}
          {skills.length === 0 && !isEditable && (
            <p className="text-xs text-txt-tertiary">등록된 스킬이 없습니다</p>
          )}
        </div>
      </Card>

      {/* 연락처·링크.
          본인 편집 모드(isEditable): 4슬롯 모두 노출해서 빈 것도 추가할 수 있게.
          타인 열람 모드(!isEditable): 채워진 필드만 노출. 모두 비어 있으면 카드 자체 숨김 —
          이전엔 4개 빈 placeholder 가 그대로 보여 "정보 없음" 느낌. */}
      {(() => {
        const items: Array<{ icon: typeof Mail; value: string; placeholder: string; fieldKey: 'contact_email' | 'portfolio_url' | 'github_url' | 'linkedin_url' }> = [
          { icon: Mail, fieldKey: 'contact_email', placeholder: '예: you@example.com', value: drafts.contact_email ?? profile.contact_email ?? '' },
          { icon: Globe, fieldKey: 'portfolio_url', placeholder: '예: https://portfolio.me', value: drafts.portfolio_url ?? profile.portfolio_url ?? '' },
          { icon: Github, fieldKey: 'github_url', placeholder: '예: https://github.com/username', value: drafts.github_url ?? profile.github_url ?? '' },
          { icon: Linkedin, fieldKey: 'linkedin_url', placeholder: '예: https://linkedin.com/in/username', value: drafts.linkedin_url ?? profile.linkedin_url ?? '' },
        ]
        const visibleItems = isEditable ? items : items.filter(i => i.value.trim().length > 0)
        if (visibleItems.length === 0) return null
        return (
          <Card title="연락처·링크" icon={Mail}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleItems.map(item => (
                <LinkField
                  key={item.fieldKey}
                  icon={item.icon}
                  placeholder={item.placeholder}
                  value={item.value}
                  onChange={v => editField(item.fieldKey)(v)}
                  editable={isEditable}
                />
              ))}
            </div>

            {isEditable && hasPendingChanges && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-brand text-white rounded-full hover:bg-brand-hover disabled:opacity-50 transition-colors"
                >
                  {isPending ? <Loader2 size={11} className="animate-spin" /> : null}
                  저장
                </button>
              </div>
            )}
          </Card>
        )
      })()}

      {/* 소속 클럽 */}
      {isEditable && myClubs.length > 0 && (
        <Card title="소속 클럽" icon={GraduationCap}>
          <ul className="space-y-2">
            {myClubs.map(c => (
              <li key={c.slug}>
                <Link
                  href={`/clubs/${c.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-sunken transition-colors group"
                >
                  {c.logo_url ? (
                    <Image src={c.logo_url} alt={c.name} width={36} height={36} className="rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-brand-bg flex items-center justify-center text-xs font-bold text-brand shrink-0">
                      {c.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-txt-primary truncate">{c.name}</p>
                    <p className="text-xs text-txt-tertiary">
                      {c.display_role || (c.role === 'owner' ? '대표' : c.role === 'admin' ? '운영진' : '멤버')}
                      {' · '}
                      멤버 {c.member_count}명
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* 프로필 완성도 */}
      {isEditable && completion.pct < 100 && (
        <Card title="프로필 완성도" icon={Circle}>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-500"
                style={{ width: `${completion.pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-brand tabular-nums shrink-0">{completion.pct}%</span>
          </div>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {completion.fields.map(f => (
              <li key={f.label} className="flex items-center gap-1.5 text-xs">
                {f.done ? (
                  <Check size={12} className="text-status-success-text shrink-0" />
                ) : (
                  <Circle size={12} className="text-txt-disabled shrink-0" />
                )}
                <span className={f.done ? 'text-txt-secondary' : 'text-txt-tertiary'}>
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

/* ── 카드 프리미티브 ── */

function Card({ title, icon: Icon, children }: {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-txt-tertiary" />
        <h3 className="text-sm font-bold text-txt-primary">{title}</h3>
      </div>
      {children}
    </section>
  )
}

/* ── 링크 필드 ── */

function LinkField({ icon: Icon, placeholder, value, onChange, editable }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  placeholder: string
  value: string
  onChange: (v: string) => void
  editable: boolean
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-2.5 bg-surface-sunken rounded-xl">
      <Icon size={14} className="text-txt-tertiary shrink-0" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={!editable}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent text-sm text-txt-primary outline-none placeholder:text-txt-disabled"
      />
    </label>
  )
}
