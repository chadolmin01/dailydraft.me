'use client'

import { useState } from 'react'
import { Onboarding } from '@/components/Onboarding'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { GuideCTA } from '@/components/LoadingGuide'

/** Preload critical onboarding SVGs — browser fetches before React renders */
const PRELOAD_SVGS = ['/onboarding/1.svg', '/onboarding/done.svg']

export default function OnboardingPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const completion = useProfileCompletion(profile)
  const [showGuide, setShowGuide] = useState(false)

  if (showGuide) {
    return <GuideCTA profile={profile} completion={completion} />
  }

  return (
    <>
      {/* Preload links — browser starts downloading before JS executes */}
      {PRELOAD_SVGS.map(src => (
        <link key={src} rel="preload" as="image" type="image/svg+xml" href={src} />
      ))}
      <Onboarding onComplete={() => setShowGuide(true)} />
    </>
  )
}
