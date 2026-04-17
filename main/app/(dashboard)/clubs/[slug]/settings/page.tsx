'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronLeft, Lock, Sparkles, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useClub } from '@/src/hooks/useClub'
import { ClubDiscordSettings } from '@/components/discord/ClubDiscordSettings'
import { ClubDiscordRoleMappings } from '@/components/discord/ClubDiscordRoleMappings'

export default function ClubSettingsPage() {
  const { slug } = useParams<{ slug: string }>()
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
        <Link
          href={`/clubs/${slug}`}
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
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

      {/* 브랜드 페르소나 진입점 */}
      <section className="mt-6">
        <Link
          href={`/clubs/${slug}/settings/persona`}
          className="block bg-surface-card border border-border rounded-2xl p-5 hover:border-[#3182F6]/40 hover:bg-surface-bg transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-surface-bg flex items-center justify-center">
              <Sparkles size={18} className="text-txt-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-txt-primary">브랜드 페르소나</h2>
              <p className="text-xs text-txt-tertiary mt-0.5">
                동아리의 정체성·독자·톤을 정의해 외부 발행 콘텐츠의 일관성을 만듭니다
              </p>
            </div>
            <ChevronLeft size={16} className="rotate-180 text-txt-tertiary shrink-0" />
          </div>
        </Link>
      </section>

      {/* 팀 채널 공개 범위 */}
      <TeamChannelVisibilityToggle clubSlug={slug} club={club} />

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

/** 팀 채널 공개 범위 토글 */
function TeamChannelVisibilityToggle({
  clubSlug,
  club,
}: {
  clubSlug: string
  club: { team_channel_visibility: 'isolated' | 'open' }
}) {
  const [value, setValue] = useState(club.team_channel_visibility)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(club.team_channel_visibility)
  }, [club.team_channel_visibility])

  const handleChange = async (newValue: 'isolated' | 'open') => {
    if (newValue === value || saving) return
    setValue(newValue)
    setSaving(true)
    try {
      const res = await fetch(`/api/clubs/${clubSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_channel_visibility: newValue }),
      })
      if (!res.ok) throw new Error()
      toast.success(
        newValue === 'isolated'
          ? '팀 채널이 팀원 전용으로 설정되었습니다'
          : '팀 채널이 전체 공개로 설정되었습니다'
      )
    } catch {
      setValue(value === 'isolated' ? 'isolated' : 'open') // rollback
      toast.error('설정 변경에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  const options = [
    {
      key: 'isolated' as const,
      icon: Lock,
      label: '팀원만 볼 수 있음',
      desc: '다른 팀의 채널은 보이지 않습니다. 창업동아리 등 아이디어 보안이 중요한 경우 권장합니다.',
    },
    {
      key: 'open' as const,
      icon: Users,
      label: '동아리 전체 공개',
      desc: '모든 팀 채널을 동아리 부원 전체가 볼 수 있습니다. 스터디, 해커톤 등 공유가 목적인 경우 적합합니다.',
    },
  ]

  return (
    <section className="mt-6">
      <div className="bg-surface-card border border-border rounded-2xl p-5">
        <h2 className="text-base font-bold text-txt-primary mb-1">팀 채널 공개 범위</h2>
        <p className="text-xs text-txt-tertiary mb-4">
          새로 생성되는 팀 채널의 Discord 권한에 적용됩니다
        </p>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = value === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => handleChange(opt.key)}
                disabled={saving}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${
                  isSelected
                    ? 'border-[#3182F6] bg-[#3182F6]/5'
                    : 'border-border hover:bg-surface-bg'
                } disabled:opacity-60`}
              >
                <div className="flex items-center gap-3">
                  <opt.icon
                    size={18}
                    className={isSelected ? 'text-[#3182F6]' : 'text-txt-tertiary'}
                  />
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-[#3182F6]' : 'text-txt-primary'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-txt-tertiary mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
