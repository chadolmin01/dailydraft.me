'use client'

import { useAuth } from '@/src/context/AuthContext'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { GuideCTA } from '@/components/LoadingGuide'

export default function GuidePage() {
  const { profile } = useAuth()
  const completion = useProfileCompletion(profile)
  return <GuideCTA profile={profile} completion={completion} />
}
