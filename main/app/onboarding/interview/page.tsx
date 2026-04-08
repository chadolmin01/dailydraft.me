'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile, profileKeys } from '@/src/hooks/useProfile'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { useQueryClient } from '@tanstack/react-query'
import { GuideCTA } from '@/components/LoadingGuide'
import { ScriptedInterviewStep } from '@/components/onboarding/steps/ScriptedInterviewStep'
import { saveProfileFromInterview } from '@/src/lib/onboarding/api'
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
  const queryClient = useQueryClient()
  const refreshProfile = useCallback(
    () => queryClient.invalidateQueries({ queryKey: profileKeys.detail(user?.id ?? '') }),
    [queryClient, user?.id]
  )
  const [phase, setPhase] = useState<'loading' | 'interview' | 'guide'>('loading')
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null)

  // Prefetch all interview SVGs — wait for first critical one
  useEffect(() => {
    let done = false
    const critical = new window.Image()
    critical.src = INTERVIEW_SVGS[1] // leader_follower.svg (first question)
    critical.onload = () => { if (!done) { done = true; setPhase('interview') } }
    critical.onerror = () => { if (!done) { done = true; setPhase('interview') } }
    const timeout = setTimeout(() => { if (!done) { done = true; setPhase('interview') } }, 1500)
    INTERVIEW_SVGS.forEach(src => { const img = new window.Image(); img.src = src })
    return () => clearTimeout(timeout)
  }, [])

  // Load draft from sessionStorage (set by /onboarding page)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('onboarding-draft')
      if (raw) {
        setProfileDraft(JSON.parse(raw))
      } else {
        // No draft — redirect back to onboarding
        router.replace('/onboarding')
      }
    } catch {
      router.replace('/onboarding')
    }
  }, [router])

  const handleInterviewComplete = useCallback(async (responses: StructuredResponse[]) => {
    if (!profileDraft) return

    // Transition to guide immediately — save in background
    // ScriptedInterviewStep shows its own "completing" animation for ~2.5s
    const savePromise = saveProfileFromInterview(profileDraft, responses)
      .then(() => Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        refreshProfile(),
      ]))
      .catch(err => console.error('Failed to save interview:', err))

    // Wait for the completing animation, then show guide
    await Promise.all([
      savePromise,
      new Promise(resolve => setTimeout(resolve, 2500)),
    ])

    sessionStorage.removeItem('onboarding-draft')
    setPhase('guide')
  }, [profileDraft, queryClient, refreshProfile])

  const handleSkip = useCallback(() => {
    sessionStorage.removeItem('onboarding-draft')
    setPhase('guide')
  }, [])

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

  if (!profileDraft) {
    return null // loading draft from sessionStorage
  }

  return (
    <div className="fixed inset-0 bg-surface-bg flex flex-col">
      <ScriptedInterviewStep
        profile={profileDraft}
        introMessage={`${profileDraft.name}님, 몇 가지만 골라주세요!`}
        onAnswer={() => {}}
        onComplete={handleInterviewComplete}
        onSkip={handleSkip}
      />
    </div>
  )
}
