'use client'

import { useRouter } from 'next/navigation'
import { LoadingGuide } from '@/components/LoadingGuide'

export default function GuidePage() {
  const router = useRouter()

  return <LoadingGuide onComplete={() => router.push('/dashboard')} />
}
