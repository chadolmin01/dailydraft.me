'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile, profileKeys } from '@/src/hooks/useProfile'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { useMicroPrompt } from '@/src/hooks/useMicroPrompt'
import { useQueryClient } from '@tanstack/react-query'
import { GuideCTA } from '@/components/LoadingGuide'
import { ScriptedInterviewStep } from '@/components/onboarding/steps/ScriptedInterviewStep'
import { saveProfileFromInterview, OnboardingError } from '@/src/lib/onboarding/api'
import { clearDraftLocal, loadDraftLocal } from '@/src/lib/onboarding/draft-storage'
import { trackOnboardingEvent } from '@/src/lib/onboarding/analytics'
import { OfflineBanner } from '@/components/onboarding/OfflineBanner'
import type { ProfileDraft, StructuredResponse } from '@/src/lib/onboarding/types'

/** All SVGs used during the interview — prefetch on mount */
const INTERVIEW_SVGS = [
  '/onboarding/almost.svg',
  '/onboarding/leader_follower.svg',
  '/onboarding/2.svg',
  '/onboarding/3.svg',
  '/onboarding/4.svg',
  '/onboarding/5.svg',
  '/onboarding/6.svg',
  '/onboarding/Deadline.svg',
  '/onboarding/done.svg',
  '/onboarding/add_project.svg',
]

export default function OnboardingInterviewPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const completion = useProfileCompletion(profile ?? null)
  const { state: microState } = useMicroPrompt()
  const queryClient = useQueryClient()
  const refreshProfile = useCallback(
    () => queryClient.invalidateQueries({ queryKey: profileKeys.detail(user?.id ?? '') }),
    [queryClient, user?.id]
  )
  const [phase, setPhase] = useState<'loading' | 'interview' | 'guide'>('loading')
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null)

  // Prefetch all interview SVGs — wait for first critical one
  useEffect(() => {
    trackOnboardingEvent('onboarding_interview_started')
    let done = false
    const critical = new window.Image()
    critical.src = INTERVIEW_SVGS[1] // leader_follower.svg (first question)
    critical.onload = () => { if (!done) { done = true; setPhase('interview') } }
    critical.onerror = () => { if (!done) { done = true; setPhase('interview') } }
    const timeout = setTimeout(() => { if (!done) { done = true; setPhase('interview') } }, 500)
    INTERVIEW_SVGS.forEach(src => { const img = new window.Image(); img.src = src })
    return () => clearTimeout(timeout)
  }, [])

  // Load draft from sessionStorage (set by /onboarding page).
  // 없으면 DB profile 에서 재구성 (새로고침·다른 기기·재진입 대응).
  // 둘 다 없으면 /onboarding 으로.
  useEffect(() => {
    // 1순위: sessionStorage (같은 탭 내 이동)
    try {
      const raw = sessionStorage.getItem('onboarding-draft')
      if (raw) {
        setProfileDraft(JSON.parse(raw))
        return
      }
    } catch {}
    // 2순위: localStorage (다른 탭·재접속 복구)
    const stored = loadDraftLocal()
    if (stored?.draft?.name?.trim()) {
      setProfileDraft(stored.draft)
      return
    }
    // 3순위: DB profile 재구성
    if (profile && profile.onboarding_completed) {
      const reconstructed: ProfileDraft = {
        name: profile.nickname || '',
        affiliationType: (profile.affiliation_type as string) || 'student',
        university: profile.university || '',
        major: profile.major || '',
        locations: (profile.locations as string[] | null) ?? [],
        position: profile.desired_position || '',
        situation: profile.current_situation || 'exploring',
        skills: (profile.skills as Array<{ name: string } | string> | null)?.map(s =>
          typeof s === 'string' ? s : s?.name || '',
        ).filter(Boolean) ?? [],
        interests: (profile.interest_tags as string[] | null) ?? [],
      }
      setProfileDraft(reconstructed)
      return
    }
    // profile 로드 끝났고 basic 도 미완료 — 처음부터
    if (profile !== undefined && profile !== null && !profile?.onboarding_completed) {
      router.replace('/onboarding')
    }
  }, [router, profile])

  const handleInterviewComplete = useCallback(async (responses: StructuredResponse[]) => {
    if (!profileDraft) return

    // Transition to guide immediately — save in background
    // ScriptedInterviewStep shows its own "completing" animation for ~2.5s
    const savePromise = saveProfileFromInterview(profileDraft, responses)
      .then(() => Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        refreshProfile(),
      ]))
      .catch(err => {
        console.error('Failed to save interview:', err)
        trackOnboardingEvent('onboarding_error', {
          step: 'interview',
          source: profileDraft.source ?? null,
          errorKind: err instanceof OnboardingError ? err.kind : 'unknown',
        })
      })

    // Wait for save + short completing animation, then show guide
    await Promise.all([
      savePromise,
      new Promise(resolve => setTimeout(resolve, 1200)),
    ])

    trackOnboardingEvent('onboarding_interview_completed', {
      source: profileDraft.source ?? null,
    })
    // 성공 시 로컬 스냅샷 완전 정리 (recovery offer 가 다시 뜨지 않게)
    clearDraftLocal()
    setPhase('guide')
  }, [profileDraft, queryClient, refreshProfile])

  const handleSkip = useCallback(() => {
    trackOnboardingEvent('onboarding_interview_skipped', {
      source: profileDraft?.source ?? null,
    })
    // 성공 시 로컬 스냅샷 완전 정리 (recovery offer 가 다시 뜨지 않게)
    clearDraftLocal()
    setPhase('guide')
  }, [profileDraft])

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-surface-bg flex items-center justify-center">
        <div className="w-10 h-10 bg-surface-inverse rounded-xl flex items-center justify-center animate-pulse">
          <span className="text-txt-inverse font-black text-lg leading-none">D</span>
        </div>
      </div>
    )
  }

  if (phase === 'guide') {
    return <GuideCTA profile={profile ?? null} completion={completion} />
  }

  // profileDraft + microState 둘 다 로드될 때까지 대기 (microState 는 smart skip 결정에 필요)
  if (!profileDraft || !microState.loaded) {
    return null
  }

  return (
    <>
      <OfflineBanner />
      <div className="fixed inset-0 ob-atmos flex flex-col">
        <ScriptedInterviewStep
          profile={profileDraft}
          prefilledAnswers={microState.loaded ? microState.responses : undefined}
          introMessage={`${profileDraft.name} 님, 몇 가지만 골라 주시면 팀 매칭이 훨씬 정확해집니다. 2분 정도 걸립니다.`}
          onAnswer={() => {}}
          onComplete={handleInterviewComplete}
          onSkip={handleSkip}
        />
      </div>
    </>
  )
}
