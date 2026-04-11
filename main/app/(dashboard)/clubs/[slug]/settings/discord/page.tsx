'use client'

import { useParams } from 'next/navigation'
import { DiscordSettingsWizard } from '@/components/discord/DiscordSettingsWizard'

export default function DiscordSettingsPage() {
  const params = useParams()
  const slug = params.slug as string

  return <DiscordSettingsWizard clubSlug={slug} />
}
