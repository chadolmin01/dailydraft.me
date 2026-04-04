'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Check,
  Circle,
  CheckCircle2,
  Plus,
  Search,
  Users,
  FolderOpen,
  TrendingUp,
  UserPen,
  Sparkles,
  Pencil,
} from 'lucide-react'
import type { Tables } from '@/src/types/database'
import { supabase } from '@/src/lib/supabase/client'

/* ─── Types ─── */

interface GuideCTAProps {
  profile: Tables<'profiles'> | null
  completion: {
    fields: { label: string; done: boolean }[]
    completedCount: number
    pct: number
  }
}

interface CTAItem {
  title: string
  primary: { label: string; desc: string; href: string; icon: React.ElementType }
  secondary: { label: string; href: string; icon: React.ElementType }
}

/* ─── CTA Config by situation ─── */

const CTA_CONFIG: Record<string, CTAItem> = {
  has_project: {
    title: '프로젝트를 함께할 팀원을 찾아볼까요?',
    primary: {
      label: '내 프로젝트 등록하기',
      desc: '팀원 모집부터 일정 관리까지 한 곳에서',
      href: '/projects/new',
      icon: Plus,
    },
    secondary: { label: '다른 프로젝트 둘러보기', href: '/explore', icon: FolderOpen },
  },
  want_to_join: {
    title: '나에게 맞는 프로젝트를 찾아볼까요?',
    primary: {
      label: '나에게 맞는 프로젝트 보기',
      desc: '관심 분야와 기술 스택 기반 추천',
      href: '/explore',
      icon: Search,
    },
    secondary: { label: '프로필 완성하기', href: '/profile/edit', icon: UserPen },
  },
  solo: {
    title: '같이 시작할 사람을 찾아볼까요?',
    primary: {
      label: '지금 뜨는 프로젝트 구경하기',
      desc: '이번 주 인기 프로젝트를 확인해보세요',
      href: '/explore',
      icon: TrendingUp,
    },
    secondary: { label: '내 프로젝트 만들기', href: '/projects/new', icon: Plus },
  },
  exploring: {
    title: '어디서부터 시작할지 고민이라면,',
    primary: {
      label: '어떤 사람들이 있는지 보기',
      desc: '다양한 포지션의 사람들을 만나보세요',
      href: '/explore?tab=people',
      icon: Users,
    },
    secondary: { label: '프로젝트 둘러보기', href: '/explore', icon: FolderOpen },
  },
}

/* ─── Component ─── */

export function GuideCTA({ profile, completion }: GuideCTAProps) {
  const [phase, setPhase] = useState<'welcome' | 'cta'>('welcome')

  useEffect(() => {
    const t = setTimeout(() => setPhase('cta'), 1200)
    return () => clearTimeout(t)
  }, [])

  // Bio inline editor state
  const [generatedBio, setGeneratedBio] = useState<string | null>(null)
  const [bioEdit, setBioEdit] = useState('')
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioSaving, setBioSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const bio = localStorage.getItem('onboarding-bio')
      if (bio) {
        localStorage.removeItem('onboarding-bio')
        setGeneratedBio(bio)
        setBioEdit(bio)
      }
    } catch {}
  }, [])

  const handleBioSave = useCallback(async () => {
    const trimmed = bioEdit.trim()
    if (!trimmed || bioSaving) return
    setBioSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').update({ bio: trimmed }).eq('user_id', user.id)
      }
      toast.success('자기소개가 저장됐어요')
      setGeneratedBio(null)
    } catch {
      toast.error('저장에 실패했어요. 프로필에서 다시 시도해주세요.')
    } finally {
      setBioSaving(false)
    }
  }, [bioEdit, bioSaving])

  const handleBioDismiss = useCallback(() => {
    setGeneratedBio(null)
  }, [])

  const situation = profile?.current_situation ?? 'exploring'
  const cta = CTA_CONFIG[situation] ?? CTA_CONFIG.exploring
  const nickname = profile?.nickname ?? '회원'
  const showNudge = completion.pct < 100

  const PrimaryIcon = cta.primary.icon
  const SecondaryIcon = cta.secondary.icon

  return (
    <div className="fixed inset-0 z-50 bg-surface-bg flex flex-col items-center justify-center font-sans p-6">
      <div className="w-full max-w-md relative">
        {/* ── Welcome Phase ── */}
        {phase === 'welcome' && (
          <div className="flex flex-col items-center animate-slide-up-fade">
            <img
              src="/onboarding/1.svg"
              alt="준비 완료"
              className="w-full max-w-[200px] object-contain mb-8"
              style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' }}
            />

            <div className="flex items-center gap-2 mb-2" style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '300ms' }}>
              <CheckCircle2 size={16} className="text-txt-primary" />
              <h2 className="text-lg font-bold text-txt-primary">
                {nickname}님, 준비 완료!
              </h2>
            </div>

            <p className="text-sm text-txt-secondary" style={{ animation: 'dcto-step 0.5s cubic-bezier(0.16, 1, 0.3, 1) both', animationDelay: '450ms' }}>
              이제 Draft를 시작해볼까요?
            </p>
          </div>
        )}

        {/* ── CTA Phase ── */}
        {phase === 'cta' && (
          <div className="flex flex-col items-center animate-slide-up-fade">

            {/* Illustration */}
            <div className="flex justify-center mb-10">
              <img
                src="/onboarding/add_project.svg"
                alt="시작하기"
                className="w-full max-w-[260px] object-contain animate-in fade-in slide-in-from-bottom-3 duration-500"
              />
            </div>

            {/* Message */}
            <h2 className="text-2xl sm:text-[28px] font-black text-txt-primary leading-tight mb-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: '100ms' }}>
              {cta.title}
            </h2>
            <p className="text-[14px] text-txt-secondary text-center mb-10 animate-in fade-in duration-300" style={{ animationDelay: '200ms' }}>
              이제 Draft에서 첫 발을 내딛어 보세요
            </p>

            {/* CTA Buttons */}
            <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '350ms' }}>
              {/* Primary */}
              <Link
                href={cta.primary.href}
                className="w-full flex items-center justify-center gap-2 py-4 bg-brand text-white rounded-full text-[15px] font-black hover:opacity-90 active:scale-[0.97] transition-all"
              >
                <PrimaryIcon size={16} />
                {cta.primary.label}
              </Link>

              {/* Secondary */}
              <Link
                href={cta.secondary.href}
                className="w-full flex items-center justify-center gap-2 py-4 bg-surface-sunken text-txt-secondary rounded-full text-[14px] font-bold hover:bg-surface-card hover:text-txt-primary active:scale-[0.97] transition-all"
              >
                <SecondaryIcon size={16} />
                {cta.secondary.label}
              </Link>
            </div>

            {/* Profile Nudge */}
            {showNudge && (
              <div
                className="w-full mt-8 pt-6 border-t border-border animate-in fade-in duration-300"
                style={{ animationDelay: '500ms' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase text-txt-tertiary">
                    PROFILE
                  </span>
                  <span className="text-[10px] font-mono font-bold text-txt-primary">
                    {completion.pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-surface-sunken rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${completion.pct}%` }}
                  />
                </div>

                {/* Field checklist */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
                  {completion.fields.map((f) => (
                    <span
                      key={f.label}
                      className="flex items-center gap-1 text-xs text-txt-secondary"
                    >
                      {f.done ? (
                        <Check size={12} className="text-brand" />
                      ) : (
                        <Circle size={12} className="text-txt-disabled" />
                      )}
                      {f.label}
                    </span>
                  ))}
                </div>

                <Link
                  href="/profile/edit"
                  className="text-xs font-bold text-txt-primary underline underline-offset-2 hover:text-brand transition-colors"
                >
                  프로필 완성하러 가기 →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Bio Inline Editor ── */}
        {generatedBio && phase === 'cta' && (
          <div
            className="mt-3 bg-surface-card rounded-xl border border-border shadow-lg overflow-hidden animate-slide-up-fade"
            style={{ animationDelay: '800ms', animationFillMode: 'both' }}
          >
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-txt-tertiary" />
                <span className="text-[10px] font-medium text-txt-tertiary">
                  AI가 작성한 자기소개
                </span>
              </div>

              {isEditingBio ? (
                <textarea
                  ref={textareaRef}
                  value={bioEdit}
                  onChange={e => setBioEdit(e.target.value)}
                  maxLength={200}
                  rows={3}
                  className="w-full text-sm text-txt-primary bg-surface-sunken border border-border rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-brand/30"
                  autoFocus
                />
              ) : (
                <p className="text-sm text-txt-primary leading-relaxed">
                  &ldquo;{bioEdit}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between mt-3">
                {isEditingBio ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBioSave}
                      disabled={bioSaving || !bioEdit.trim()}
                      className="text-xs font-bold text-white bg-surface-inverse px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      {bioSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => { setIsEditingBio(false); setBioEdit(generatedBio) }}
                      className="text-xs text-txt-disabled hover:text-txt-secondary transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBioSave}
                      disabled={bioSaving}
                      className="text-xs font-bold text-white bg-surface-inverse px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      {bioSaving ? '저장 중...' : '이대로 쓸게요'}
                    </button>
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="flex items-center gap-1 text-xs text-txt-secondary hover:text-txt-primary transition-colors"
                    >
                      <Pencil size={12} />
                      수정
                    </button>
                  </div>
                )}
                <button
                  onClick={handleBioDismiss}
                  className="text-xs text-txt-disabled hover:text-txt-secondary transition-colors"
                >
                  나중에
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-brand/10 to-brand/5 blur-2xl -z-10" />
      </div>
    </div>
  )
}
