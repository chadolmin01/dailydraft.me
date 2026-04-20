'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { toastErrorWithRetry } from '@/src/lib/toast-helpers'
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
  Ticket,
  Loader2,
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
    secondary: { label: '프로필 완성하기', href: '/profile', icon: UserPen },
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
  const router = useRouter()
  const [showWelcome, setShowWelcome] = useState(true)
  const [showCta, setShowCta] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [inviteExpanded, setInviteExpanded] = useState(false)
  const [inviteSubmitting, setInviteSubmitting] = useState(false)

  const handleRedeemCode = useCallback(async () => {
    const code = inviteCode.trim()
    if (!code) return
    setInviteSubmitting(true)
    try {
      const res = await fetch('/api/clubs/join-by-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const body = await res.json().catch(() => ({})) as {
        data?: { club_slug?: string; club_name?: string; already_member?: boolean; role?: string }
        error?: { message?: string }
      }
      if (!res.ok) {
        toast.error(body.error?.message ?? '가입에 실패했습니다')
        return
      }
      const slug = body.data?.club_slug
      const name = body.data?.club_name ?? '클럽'
      if (body.data?.already_member) {
        toast.info(`이미 ${name} 멤버입니다`)
      } else if (body.data?.role === 'admin') {
        toast.success(`${name} 운영진으로 가입되었습니다`)
      } else {
        toast.success(`${name}에 가입되었습니다`)
      }
      if (slug) router.push(`/clubs/${slug}`)
    } catch {
      toastErrorWithRetry('네트워크 오류가 발생했습니다', () => handleRedeemCode())
    } finally {
      setInviteSubmitting(false)
    }
  }, [inviteCode, router])

  useEffect(() => {
    // welcome 표시 후 fade-out → cta fade-in (cross-fade)
    const t1 = setTimeout(() => setShowWelcome(false), 1200)  // welcome fade-out 시작
    const t2 = setTimeout(() => setShowCta(true), 1500)       // cta fade-in 시작 (300ms 갭)
    return () => { clearTimeout(t1); clearTimeout(t2) }
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

  // next/image priority 로 동일 효과 — 별도 프리로드 불필요

  const situation = profile?.current_situation ?? 'exploring'
  const cta = CTA_CONFIG[situation] ?? CTA_CONFIG.exploring
  const nickname = profile?.nickname ?? '회원'
  const showNudge = completion.pct < 100

  const PrimaryIcon = cta.primary.icon
  const SecondaryIcon = cta.secondary.icon

  return (
    <div className="fixed inset-0 z-50 bg-surface-bg flex flex-col items-center justify-center font-sans p-6">
      <div className="w-full max-w-md relative">
        {/* ── Welcome Phase (cross-fade out) ── */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${showWelcome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <Image
            src="/onboarding/1.svg"
            alt="준비 완료"
            width={200}
            height={200}
            priority
            className="w-full max-w-[200px] h-auto object-contain mb-8"
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

        {/* ── CTA Phase (cross-fade in — always rendered, opacity transition) ── */}
        <div className={`flex flex-col items-center transition-all duration-500 ease-out ${showCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>

          {/* Illustration — preloaded via link[rel=preload] avoids layout shift */}
          <div className="flex justify-center mb-10">
            <Image
              src="/onboarding/add_project.svg"
              alt="시작하기"
              width={260}
              height={260}
              className="w-full max-w-[260px] h-auto object-contain"
            />
          </div>

          {/* Message */}
          <h2 className="text-2xl sm:text-[28px] font-black text-txt-primary leading-tight mb-2 text-center">
            {cta.title}
          </h2>
          <p className="text-[14px] text-txt-secondary text-center mb-10">
            이제 Draft에서 첫 발을 내딛어 보세요
          </p>

          {/* CTA Buttons */}
          <div className="w-full space-y-3">
            {/* Primary */}
            <Link
              href={cta.primary.href}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand text-white rounded-full text-[15px] font-black hover:opacity-90 active:scale-[0.97] transition-all"
            >
              {/* @ts-expect-error lucide icon size prop */}
              <PrimaryIcon size={16} />
              {cta.primary.label}
            </Link>

            {/* Secondary */}
            <Link
              href={cta.secondary.href}
              className="w-full flex items-center justify-center gap-2 py-4 bg-surface-sunken text-txt-secondary rounded-full text-[14px] font-bold hover:bg-surface-card hover:text-txt-primary active:scale-[0.97] transition-all"
            >
              {/* @ts-expect-error lucide icon size prop */}
              <SecondaryIcon size={16} />
              {cta.secondary.label}
            </Link>
          </div>

          {/* 초대 코드 입력 — 동아리/학회에서 코드 받아온 경우 */}
          <div className="w-full mt-6">
            {!inviteExpanded ? (
              <button
                onClick={() => setInviteExpanded(true)}
                className="w-full flex items-center justify-center gap-1.5 text-[12px] text-txt-tertiary hover:text-txt-primary transition-colors"
              >
                <Ticket size={12} />
                초대 코드가 있어요
              </button>
            ) : (
              <div className="bg-surface-card border border-border rounded-xl p-4">
                <p className="text-[12px] font-semibold text-txt-primary mb-2 flex items-center gap-1.5">
                  <Ticket size={12} className="text-brand" />
                  운영진에게 받은 초대 코드를 입력하세요
                </p>
                <div className="flex gap-2">
                  <input
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase().slice(0, 30))}
                    placeholder="XXXXXXXX"
                    autoFocus
                    className="flex-1 px-3 py-2 text-[14px] tracking-wider tabular-nums font-bold bg-surface-bg border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  <button
                    onClick={handleRedeemCode}
                    disabled={inviteSubmitting || !inviteCode.trim()}
                    className="shrink-0 flex items-center gap-1 px-4 py-2 text-[13px] font-semibold bg-brand text-white rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-colors"
                  >
                    {inviteSubmitting ? <Loader2 size={13} className="animate-spin" /> : null}
                    가입
                  </button>
                </div>
                <button
                  onClick={() => { setInviteExpanded(false); setInviteCode('') }}
                  className="mt-2 text-[11px] text-txt-tertiary hover:text-txt-primary transition-colors"
                >
                  닫기
                </button>
              </div>
            )}
          </div>

          {/* Profile Nudge */}
          {showNudge && (
            <div
              className={`w-full mt-8 pt-6 border-t border-border transition-opacity duration-300 ${showCta ? 'opacity-100' : 'opacity-0'}`}
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
                href="/profile"
                className="text-xs font-bold text-txt-primary underline underline-offset-2 hover:text-brand transition-colors"
              >
                프로필 완성하러 가기 →
              </Link>
            </div>
          )}
        </div>

        {/* ── Bio Inline Editor ── */}
        {generatedBio && (
          <div
            className={`mt-3 bg-surface-card rounded-xl border border-border shadow-lg overflow-hidden transition-all duration-500 ${showCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
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
