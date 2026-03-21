'use client'

import { Onboarding } from '@/components/Onboarding'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()

  return <Onboarding onComplete={() => router.push('/guide')} />
}
