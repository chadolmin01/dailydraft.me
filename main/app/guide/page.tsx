'use client'

import { useProfile } from '@/src/hooks/useProfile'
import { useProfileCompletion } from '@/src/hooks/useProfileCompletion'
import { GuideCTA } from '@/components/LoadingGuide'

export default function GuidePage() {
  const { data: profile } = useProfile()
  const completion = useProfileCompletion(profile ?? null)
  return <GuideCTA profile={profile ?? null} completion={completion} />
}
