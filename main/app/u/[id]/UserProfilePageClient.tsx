'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Heart, Share2, Check, Mail, Globe, Github, Linkedin, MapPin, Building2, Sparkles, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useDetailedPublicProfile } from '@/src/hooks/usePublicProfiles'
import { useProfileInterest } from '@/src/hooks/useProfileInterest'
import { usePortfolioItems } from '@/src/hooks/usePortfolioItems'
import { useAuth } from '@/src/context/AuthContext'
import { cleanNickname } from '@/src/lib/clean-nickname'
import { positionLabel } from '@/src/constants/roles'
import { AFFILIATION_LABELS, SITUATION_LABELS } from '@/components/profile-modal/types'
import { PublicActivity } from '@/components/profile/PublicActivity'
import { PersonalityScorecard } from '@/components/profile/PersonalityScorecard'
import { QrCard } from '@/components/ui/QrCard'

/**
 * 공개 프로필 페이지 — 모달의 풀스크린 대체.
 * 모달 대비 의도적 축소:
 * - 커피챗/초대 같은 트랜잭션은 링크/버튼으로 모달 트리거 (페이지 전환 대신 빠른 1-step)
 * - portfolio 탭 토글 대신 섹션 스크롤
 * - mobile drag handle 없음 (URL 이동이라 필요 없음)
 */
export function UserProfilePageClient({ profileId }: { profileId: string }) {
  const { user } = useAuth()
  const [shareCopied, setShareCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showQrCard, setShowQrCard] = useState(false)

  const { data: profile, isLoading } = useDetailedPublicProfile(profileId)
  const profileUserId = profile?.user_id ?? undefined
  const { hasInterested, interestCount, interestLoading, handleInterest } = useProfileInterest(
    profile?.id,
    profileUserId,
  )
  const { data: portfolioItems = [] } = usePortfolioItems(profileUserId)

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
      toast.success('링크가 복사되었습니다')
    } catch {
      toast.error('링크 복사에 실패했습니다')
    }
  }

  const handleShareFormatted = async (kind: 'kakao' | 'linkedin') => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const name = profile?.nickname ?? '프로필'
    const position = profile?.desired_position ?? ''
    const text = kind === 'kakao'
      ? `${name}의 Draft 포트폴리오입니다.\n${position ? position + ' · ' : ''}지금까지의 활동 이력과 참여 프로젝트를 확인해보세요.\n${url}`
      : `${name}${position ? ` (${position})` : ''} · Draft 포트폴리오\n\n대학 동아리·프로젝트 활동 이력과 주간 기록 링크입니다.\n${url}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success(kind === 'kakao' ? '카톡용 문구를 복사했습니다' : 'LinkedIn용 문구를 복사했습니다', {
        description: kind === 'kakao'
          ? '카톡에 붙여넣기 하시면 링크 미리보기가 자동으로 뜹니다.'
          : 'LinkedIn 포스트에 붙여넣으시면 됩니다. 프로필 OG 이미지가 자동 첨부됩니다.',
      })
      setShowShareMenu(false)
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-5">
          <div className="h-8 bg-surface-sunken rounded w-32" />
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-surface-sunken rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-surface-sunken rounded w-48" />
              <div className="h-4 bg-surface-sunken rounded w-64" />
            </div>
          </div>
          <div className="h-24 bg-surface-sunken rounded-xl" />
          <div className="h-40 bg-surface-sunken rounded-xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-sm text-txt-tertiary">프로필을 찾을 수 없습니다.</p>
        <Link href="/explore" className="inline-block mt-4 text-[13px] text-brand hover:underline">
          탐색으로 돌아가기
        </Link>
      </div>
    )
  }

  const name = cleanNickname(profile.nickname || '')
  const position = profile.desired_position
  const affiliationLabel = profile.affiliation_type
    ? AFFILIATION_LABELS[profile.affiliation_type]
    : null
  const situationLabel = profile.current_situation
    ? SITUATION_LABELS[profile.current_situation]
    : null

  // vision_summary 파싱
  let visionText: string | null = null
  let visionGoals: string[] = []
  if (profile.vision_summary) {
    try {
      const parsed = JSON.parse(profile.vision_summary as string)
      visionText = parsed?.summary ?? null
      if (Array.isArray(parsed?.goals)) visionGoals = parsed.goals as string[]
    } catch {
      visionText = profile.vision_summary as string
    }
  }
  const bio = profile.bio || visionText
  const skills = (profile.skills as Array<{ name: string; level?: string }> | null) ?? []
  const isOwn = user?.id === profile.user_id

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-6 print:py-0 print:max-w-none print:bg-white">
      {/* 상단 바 — 인쇄 시 숨김 */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link
          href="/explore"
          className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
        >
          <ChevronLeft size={16} />
          탐색
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-txt-secondary hover:text-txt-primary border border-border rounded-full hover:border-txt-tertiary transition-colors"
            aria-label="포트폴리오 PDF 저장"
          >
            <Printer size={14} />
            PDF 저장
          </button>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-txt-secondary hover:text-txt-primary border border-border rounded-full hover:border-txt-tertiary transition-colors"
              aria-label="공유"
            >
              {shareCopied ? <Check size={14} /> : <Share2 size={14} />}
              {shareCopied ? '복사됨' : '공유'}
            </button>
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface-card border border-border rounded-xl shadow-lg p-1.5 z-20">
                <button
                  onClick={handleShare}
                  className="w-full text-left px-3 py-2 text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
                >
                  🔗 링크 복사
                </button>
                <button
                  onClick={() => handleShareFormatted('kakao')}
                  className="w-full text-left px-3 py-2 text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
                >
                  💬 카톡·문자용 메시지
                </button>
                <button
                  onClick={() => handleShareFormatted('linkedin')}
                  className="w-full text-left px-3 py-2 text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
                >
                  💼 LinkedIn용 메시지
                </button>
                <button
                  onClick={() => { setShowQrCard(v => !v); setShowShareMenu(false) }}
                  className="w-full text-left px-3 py-2 text-[13px] text-txt-primary hover:bg-surface-sunken rounded-lg transition-colors"
                >
                  📇 명함 QR 보기
                </button>
              </div>
            )}
          </div>
          {!isOwn && user && (
            <button
              onClick={handleInterest}
              disabled={interestLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-full transition-colors ${
                hasInterested
                  ? 'bg-status-danger-bg text-status-danger-text'
                  : 'bg-surface-sunken text-txt-secondary hover:bg-border'
              }`}
              aria-label="관심"
            >
              <Heart size={14} className={hasInterested ? 'fill-current' : ''} />
              {interestCount ?? 0}
            </button>
          )}
        </div>
      </div>

      {/* QR 명함 패널 — 공유 메뉴에서 토글 */}
      {showQrCard && (
        <div className="mb-6 print:hidden flex justify-center">
          <QrCard
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={`${cleanNickname(profile.nickname || '') || '프로필'} · Draft 명함`}
            subtitle={profile.desired_position ? positionLabel(profile.desired_position) : '이력·활동·프로젝트를 한 URL 에서 확인'}
            size={240}
          />
        </div>
      )}

      {/* 프로필 헤더 */}
      <header className="flex items-start gap-4 mb-8">
        <div className="relative w-20 h-20 bg-brand rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden">
          {name.substring(0, 2)}
          {profile.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={name}
              width={80}
              height={80}
              className="absolute inset-0 w-20 h-20 object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-txt-primary mb-1">{name}</h1>
          {position && (
            <p className="text-sm text-txt-secondary mb-2">{positionLabel(position) || position}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-txt-tertiary">
            {affiliationLabel && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} />
                {affiliationLabel}
              </span>
            )}
            {profile.university && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} />
                {profile.university}
                {profile.major ? ` · ${profile.major}` : ''}
              </span>
            )}
            {profile.locations && profile.locations.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {profile.locations.join(', ')}
              </span>
            )}
            {situationLabel && (
              <span className="inline-flex items-center gap-1 text-brand">
                <Sparkles size={12} />
                {situationLabel}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Bio / Vision */}
      {bio && (
        <section className="mb-8">
          <p className="text-[15px] leading-relaxed text-txt-primary whitespace-pre-wrap break-keep">{bio}</p>
        </section>
      )}

      {/* 관심 목표 */}
      {visionGoals.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] font-bold text-txt-tertiary mb-3">목표</h2>
          <ul className="space-y-2">
            {visionGoals.map((goal, i) => (
              <li key={i} className="text-[14px] text-txt-primary leading-relaxed flex gap-2">
                <span className="text-brand shrink-0 mt-0.5">—</span>
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 스킬 */}
      {skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] font-bold text-txt-tertiary mb-3">스킬</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s.name}
                className="px-3 py-1.5 bg-surface-sunken text-[13px] text-txt-secondary rounded-full"
              >
                {s.name}
                {s.level ? ` · ${s.level}` : ''}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 관심 태그 */}
      {profile.interest_tags && profile.interest_tags.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] font-bold text-txt-tertiary mb-3">관심 분야</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interest_tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-brand-bg text-[13px] text-brand rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 외부 링크 */}
      {(profile.portfolio_url || profile.github_url || profile.linkedin_url || profile.contact_email) && (
        <section className="mb-8">
          <h2 className="text-[13px] font-bold text-txt-tertiary mb-3">연락처</h2>
          <div className="flex flex-wrap gap-2">
            {profile.contact_email && (
              <a
                href={`mailto:${profile.contact_email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-txt-secondary border border-border rounded-xl hover:border-txt-tertiary transition-colors"
              >
                <Mail size={14} />
                이메일
              </a>
            )}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-txt-secondary border border-border rounded-xl hover:border-txt-tertiary transition-colors"
              >
                <Globe size={14} />
                포트폴리오
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-txt-secondary border border-border rounded-xl hover:border-txt-tertiary transition-colors"
              >
                <Github size={14} />
                GitHub
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] text-txt-secondary border border-border rounded-xl hover:border-txt-tertiary transition-colors"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
            )}
          </div>
        </section>
      )}

      {/* AI 인터뷰 결과 — 매칭 축 공개 표시 (공개 프로필 한정 정보) */}
      {profile.personality && (
        <section className="mb-8">
          <PersonalityScorecard
            personality={profile.personality as {
              teamRole?: number; communication?: number; planning?: number
              risk?: number; quality?: number; time?: number
            } | null}
            hoursPerWeek={(() => {
              if (!profile.vision_summary) return null
              try {
                const v = JSON.parse(profile.vision_summary as string)
                const h = v?.availability?.hours_per_week
                return typeof h === 'number' ? h : null
              } catch { return null }
            })()}
          />
        </section>
      )}

      {/* Draft 내부 활동 이력 (소속·프로젝트·기여) */}
      {profile.user_id && (
        <div className="mb-8">
          <PublicActivity userId={profile.user_id} />
        </div>
      )}

      {/* 포트폴리오 아이템 */}
      {portfolioItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] font-bold text-txt-tertiary mb-3">포트폴리오</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {portfolioItems.map((item) => (
              <article
                key={item.id}
                className="bg-surface-card border border-border rounded-xl p-4"
              >
                <h3 className="text-[15px] font-semibold text-txt-primary mb-1">{item.title}</h3>
                {item.description && (
                  <p className="text-[13px] text-txt-secondary line-clamp-3 mb-2">{item.description}</p>
                )}
                {item.link_url && (
                  <a
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-brand hover:underline"
                  >
                    자세히 보기 →
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 비로그인 CTA — 인쇄 시 숨김 */}
      {!user && (
        <section className="mt-12 p-6 bg-brand-bg rounded-2xl text-center print:hidden">
          <p className="text-[14px] text-txt-primary mb-3">
            Draft 에서 더 많은 프로필과 프로젝트를 탐색해보세요
          </p>
          <Link
            href="/login"
            className="ob-press-spring inline-flex items-center justify-center px-5 py-2.5 bg-brand text-white text-[14px] font-semibold rounded-full hover:bg-brand-hover"
          >
            시작하기
          </Link>
        </section>
      )}
    </div>
  )
}
