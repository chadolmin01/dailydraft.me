'use client'

import { useParams } from 'next/navigation'
import { GitHubSettingsPanel } from '@/components/github/GitHubSettingsPanel'

export default function GitHubSettingsPage() {
  const params = useParams()
  const slug = params.slug as string

  return <GitHubSettingsPanel clubSlug={slug} />
}
