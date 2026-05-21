'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** 기존 /settings/discord URL을 /settings로 리다이렉트 */
export default function DiscordSettingsRedirect() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  useEffect(() => {
    router.replace(`/clubs/${slug}/settings`)
  }, [slug, router])

  return null
}
