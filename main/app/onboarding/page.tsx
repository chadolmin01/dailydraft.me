'use client'

import { useState } from 'react'
import { Onboarding } from '@/components/Onboarding'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { GuideCTA } from '@/components/LoadingGuide'

export default function OnboardingPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const completion = useProfileCompletion(profile)
  const [showGuide, setShowGuide] = useState(false)

  if (showGuide) {
    return <GuideCTA profile={profile} completion={completion} />
  }

  return <Onboarding onComplete={() => setShowGuide(true)} />
}
