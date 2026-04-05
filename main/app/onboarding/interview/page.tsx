'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
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
  const { profile, refreshProfile } = useAuth()
  const completion = useProfileCompletion(profile)
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<'interview' | 'guide'>('interview')
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null)

  // Prefetch all interview SVGs immediately
  useEffect(() => {
    INTERVIEW_SVGS.forEach(src => {
      const img = new Image()
      img.src = src
    })
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

  if (phase === 'guide') {
    return <GuideCTA profile={profile} completion={completion} />
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
