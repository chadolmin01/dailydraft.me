'use client'

import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { ClubDiscordSettings } from '@/components/discord/ClubDiscordSettings'
import { ClubDiscordRoleMappings } from '@/components/discord/ClubDiscordRoleMappings'
import { GitHubSettingsPanel } from '@/components/github/GitHubSettingsPanel'

export default function ClubSettingsPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: club, isLoading } = useClub(slug)

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-5 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-sunken rounded w-32" />
          <div className="h-48 bg-surface-sunken rounded-xl" />
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="max-w-xl mx-auto px-5 py-12 text-center">
        <p className="text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/clubs/${slug}`)}
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-txt-primary">{club.name} 설정</h1>
          <p className="text-xs text-txt-tertiary">클럽 운영 설정을 관리합니다</p>
        </div>
      </div>

      {/* Discord 연동 */}
      <section className="space-y-4">
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          <ClubDiscordSettings clubSlug={slug} />
        </div>

        {/* 역할 매핑 — Discord 연결 시에만 표시 (내부에서 guild 없으면 null) */}
        <ClubDiscordRoleMappings clubSlug={slug} />
      </section>

      {/* GitHub 연동 */}
      <section className="mt-6">
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          <GitHubSettingsPanel clubSlug={slug} />
        </div>
      </section>
    </div>
  )
}
