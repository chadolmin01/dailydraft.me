'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Lock, Sparkles, Users, ArrowRight, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useClub } from '@/src/hooks/useClub'
import { ClubDiscordSettings } from '@/components/discord/ClubDiscordSettings'
import { ClubDiscordRoleMappings } from '@/components/discord/ClubDiscordRoleMappings'
import { ClubInviteSection } from '@/components/club/ClubInviteSection'
import { ClubEmbedSnippet } from '@/components/club/ClubEmbedSnippet'
import { NotificationChannelsSection } from '@/components/club/NotificationChannelsSection'
import { ClubDataExport } from '@/components/club/ClubDataExport'

/**
 * 클럽 설정 페이지 클라이언트 셸.
 *
 * 위계 재배치:
 *   - TOP: Discord 연동 · 브랜드 페르소나 2대 핵심 카드 (가로 2열)
 *   - MID: 역할 매핑 (Discord 연결 시에만 내부에서 렌더)
 *   - BOTTOM: 팀 채널 · GitHub 안내 보조 설정 (가로 2열)
 */
export function ClubSettingsClient({ slug }: { slug: string }) {
  const { data: club, isLoading } = useClub(slug)

  if (!isLoading && !club) {
    return (
      <div className="text-center py-12">
        <p className="text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/clubs/${slug}`}
          className="text-txt-tertiary hover:text-txt-primary transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-txt-primary">
            {club ? (
              `${club.name} 설정`
            ) : (
              <span className="inline-block h-5 w-40 rounded skeleton-shimmer align-middle" />
            )}
          </h1>
          <p className="text-xs text-txt-tertiary">클럽 운영 설정을 관리합니다</p>
        </div>
      </div>

      {/* TOP — 2대 핵심 연동 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Discord 연동 */}
        <section className="bg-surface-card border border-border rounded-2xl p-5">
          <ClubDiscordSettings clubSlug={slug} />
        </section>

        {/* 브랜드 페르소나 CTA */}
        <Link
          href={`/clubs/${slug}/settings/persona`}
          className="group block bg-surface-card border border-border rounded-2xl p-5 hover:border-brand-border hover:bg-brand-bg/40 transition-colors"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-txt-primary">
                  브랜드 페르소나
                </h2>
                <p className="text-[11px] text-txt-tertiary">
                  외부 발행 콘텐츠의 일관성
                </p>
              </div>
            </div>
            <p className="text-sm text-txt-secondary leading-relaxed flex-1 mb-3">
              동아리의 정체성·독자·톤을 13개 슬롯으로 정의합니다. 주간업데이트·모집공고·SNS 캡션이 같은 목소리로 나갑니다.
            </p>
            <div className="flex items-center gap-1 text-xs font-semibold text-brand group-hover:gap-2 transition-all">
              페르소나 관리
              <ArrowRight size={13} />
            </div>
          </div>
        </Link>
      </div>

      {/* MID — 운영 자산 등록부 진입점 (Phase 0) */}
      <div className="mb-6">
        <Link
          href={`/clubs/${slug}/settings/assets`}
          className="group flex items-center gap-4 bg-surface-card border border-border rounded-2xl p-5 hover:border-brand-border hover:bg-brand-bg/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
            <FolderOpen size={18} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-txt-primary">운영 자산 등록부</h2>
            <p className="text-[12px] text-txt-tertiary mt-0.5">
              구글 드라이브·노션·디스코드·GitHub·Figma 같은 외부 도구 위치와 담당자를 한 곳에 정리합니다
            </p>
          </div>
          <ArrowRight size={16} className="text-txt-disabled group-hover:text-brand transition-colors shrink-0" />
        </Link>
      </div>

      {/* MID — 초대 섹션 (가입 경로) */}
      {club && (
        <div className="mb-6">
          <ClubInviteSection
            slug={slug}
            clubName={club.name}
            viewerRole={(club.my_role === 'owner' || club.my_role === 'admin') ? club.my_role : null}
          />
        </div>
      )}

      {/* MID — 역할 매핑 (Discord 연결 시에만 렌더) */}
      <div className="mb-6">
        <ClubDiscordRoleMappings clubSlug={slug} />
      </div>

      {/* BOTTOM — 보조 설정 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <TeamChannelVisibilityToggle clubSlug={slug} club={club} />
        <GitHubInfoCard />
      </div>

      {/* 알림 채널 (Discord/Slack 웹훅) */}
      {club && (
        <div className="mb-6">
          <NotificationChannelsSection clubId={club.id} />
        </div>
      )}

      {/* 외부 공유 */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ClubEmbedSnippet slug={slug} />
        <ClubDataExport slug={slug} />
      </div>
    </>
  )
}

/** 팀 채널 공개 범위 토글 — 2 옵션 */
function TeamChannelVisibilityToggle({
  clubSlug,
  club,
}: {
  clubSlug: string
  club: { team_channel_visibility: 'isolated' | 'open' } | null | undefined
}) {
  const initial = club?.team_channel_visibility ?? 'isolated'
  const [value, setValue] = useState<'isolated' | 'open'>(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (club?.team_channel_visibility) setValue(club.team_channel_visibility)
  }, [club?.team_channel_visibility])

  const handleChange = async (newValue: 'isolated' | 'open') => {
    if (newValue === value || saving || !club) return
    const prev = value
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
          : '팀 채널이 전체 공개로 설정되었습니다',
      )
    } catch {
      setValue(prev)
      toast.error('설정 변경에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  const options = [
    {
      key: 'isolated' as const,
      icon: Lock,
      label: '팀원만',
      desc: '창업 아이디어 보안',
    },
    {
      key: 'open' as const,
      icon: Users,
      label: '전체 공개',
      desc: '스터디·해커톤 공유',
    },
  ]

  const interactive = !!club

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-txt-primary">
          팀 채널 공개 범위
        </h2>
        {saving && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-txt-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            저장 중...
          </span>
        )}
      </div>
      <p className="text-xs text-txt-tertiary mb-4">
        새로 생성되는 팀 채널의 Discord 권한에 적용됩니다
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.key
          const Icon = opt.icon
          return (
            <button
              key={opt.key}
              onClick={() => handleChange(opt.key)}
              disabled={saving || !interactive}
              className={`text-left px-3.5 py-3 rounded-xl border transition-colors ${
                isSelected
                  ? 'border-brand bg-brand-bg'
                  : 'border-border hover:bg-surface-bg'
              } disabled:opacity-60`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  size={14}
                  className={isSelected ? 'text-brand' : 'text-txt-tertiary'}
                />
                <p
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-brand' : 'text-txt-primary'
                  }`}
                >
                  {opt.label}
                </p>
              </div>
              <p className="text-[11px] text-txt-tertiary leading-relaxed">
                {opt.desc}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function GitHubInfoCard() {
  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-surface-bg flex items-center justify-center shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-txt-primary"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-txt-primary">GitHub 연동</h2>
          <p className="text-[11px] text-txt-tertiary">팀별 레포지토리 연결</p>
        </div>
      </div>
      <p className="text-xs text-txt-secondary leading-relaxed">
        각 팀(프로젝트) 설정에서 관리합니다. 프로젝트 수정 페이지의{' '}
        <span className="font-semibold text-txt-primary">GitHub</span> 탭에서 레포지토리를 연결하면 해당 팀의 Discord 채널로 push 알림이 전송됩니다.
      </p>
    </section>
  )
}
