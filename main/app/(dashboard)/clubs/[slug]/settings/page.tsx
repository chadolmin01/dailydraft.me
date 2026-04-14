'use client'

import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { ClubDiscordSettings } from '@/components/discord/ClubDiscordSettings'
import { ClubDiscordRoleMappings } from '@/components/discord/ClubDiscordRoleMappings'

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

      {/* GitHub 연동 안내 */}
      <section className="mt-6">
        <div className="bg-surface-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-surface-bg flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-txt-primary">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-txt-primary">GitHub 연동</h2>
              <p className="text-xs text-txt-tertiary">팀별 레포지토리 연결</p>
            </div>
          </div>
          <p className="text-sm text-txt-secondary leading-relaxed">
            GitHub 연동은 각 팀(프로젝트) 설정에서 관리합니다.
            프로젝트 수정 페이지의 <span className="font-semibold text-txt-primary">GitHub</span> 탭에서
            레포지토리를 연결하면, 해당 팀의 Discord 채널로 push 알림이 전송됩니다.
          </p>
        </div>
      </section>
    </div>
  )
}
