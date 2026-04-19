'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Plus, Clock, Users, FolderOpen } from 'lucide-react'
import { calculateDaysLeft } from '@/src/hooks/useOpportunities'
import type { Opportunity } from '@/src/types/opportunity'

/**
 * 프로젝트 탭 — 내 프로젝트(생성자) + 합류 중인 팀.
 */

interface JoinedTeam {
  id: string
  title: string
  description: string
  status: string
  type: string
  demo_images: string[] | null
  needed_roles: string[] | null
  interest_tags: string[] | null
  my_role: string | null
  joined_at: string | null
  creator: { nickname: string; desired_position: string | null } | null
}

interface ProfileProjectsProps {
  opportunities: Opportunity[]
  joinedTeams?: JoinedTeam[]
}

export function ProfileProjects({ opportunities, joinedTeams = [] }: ProfileProjectsProps) {
  const hasAny = opportunities.length > 0 || joinedTeams.length > 0

  return (
    <div className="space-y-8">
      {/* 내 프로젝트 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-txt-primary flex items-center gap-2">
            내 프로젝트
            {opportunities.length > 0 && (
              <span className="text-sm font-medium text-txt-tertiary tabular-nums">{opportunities.length}</span>
            )}
          </h2>
          <Link
            href="/projects/new?from=/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus size={12} />
            새 프로젝트
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <div className="bg-surface-card border border-border rounded-2xl p-10 text-center">
            <FolderOpen size={28} className="text-txt-disabled mx-auto mb-3" />
            <p className="text-sm font-semibold text-txt-primary mb-1">아직 만든 프로젝트가 없습니다</p>
            <p className="text-xs text-txt-tertiary mb-4">아이디어를 프로젝트로 올려 팀원을 모집해보세요</p>
            <Link
              href="/projects/new?from=/profile"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-brand text-white rounded-full hover:bg-brand-hover transition-colors"
            >
              <Plus size={12} />
              프로젝트 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {opportunities.map(opp => (
              <ProjectCard
                key={opp.id}
                href={`/projects/${opp.id}`}
                title={opp.title}
                description={opp.description}
                coverSrc={opp.demo_images?.[0] || null}
                status={opp.status}
                daysLeft={calculateDaysLeft(opp.created_at)}
                neededRoles={opp.needed_roles || []}
                interestTags={opp.interest_tags || []}
                applicationsCount={opp.applications_count}
                interestCount={opp.interest_count}
              />
            ))}
          </div>
        )}
      </section>

      {/* 합류 중인 팀 */}
      {joinedTeams.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-txt-primary flex items-center gap-2 mb-4">
            <Users size={15} />
            합류 중인 팀
            <span className="text-sm font-medium text-txt-tertiary tabular-nums">{joinedTeams.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {joinedTeams.map(team => (
              <TeamCard
                key={team.id}
                href={`/explore?project=${team.id}`}
                title={team.title}
                description={team.description}
                coverSrc={team.demo_images?.[0] || null}
                myRole={team.my_role}
                creatorName={team.creator?.nickname}
              />
            ))}
          </div>
        </section>
      )}

      {/* 둘 다 비어있으면 */}
      {!hasAny && (
        <p className="text-xs text-txt-tertiary text-center">
          프로젝트에 합류하면 이 탭에 표시됩니다
        </p>
      )}
    </div>
  )
}

/* ── 프로젝트 카드 ── */

function ProjectCard({
  href, title, description, coverSrc, status, daysLeft,
  neededRoles, interestTags, applicationsCount, interestCount,
}: {
  href: string
  title: string
  description: string | null
  coverSrc: string | null
  status: string | null
  daysLeft: number
  neededRoles: string[]
  interestTags: string[]
  applicationsCount: number | null
  interestCount: number | null
}) {
  const isUrgent = daysLeft > 0 && daysLeft <= 3

  return (
    <Link
      href={href}
      className="bg-surface-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col no-underline"
    >
      {/* 커버 */}
      <div className="relative aspect-[16/9] bg-surface-sunken overflow-hidden">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={title}
            fill
            sizes="(max-width:640px) 100vw, 33vw"
            className="object-cover"
            quality={75}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-txt-disabled">
            <span className="text-3xl font-extrabold">{title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          {isUrgent ? (
            <span className="text-[11px] font-semibold bg-status-danger-text text-white px-2 py-0.5 rounded-full">
              D-{daysLeft}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-surface-card text-txt-primary px-2 py-0.5 rounded-full shadow-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-status-success-text' : 'bg-txt-disabled'}`} />
              {status === 'active' ? '모집 중' : '마감'}
            </span>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-txt-primary truncate mb-1">{title}</h3>
        {interestTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {interestTags.slice(0, 3).map(t => (
              <span key={t} className="text-[11px] font-medium text-brand bg-brand-bg px-1.5 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}
        {description && (
          <p className="text-xs text-txt-secondary line-clamp-2 mb-3 flex-1">{description}</p>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-border text-[11px] text-txt-tertiary">
          <div className="flex items-center gap-2">
            <span>지원 {applicationsCount ?? 0}</span>
            <span className="text-border">·</span>
            <span>관심 {interestCount ?? 0}</span>
          </div>
          {neededRoles.length > 0 && (
            <span className="font-medium text-txt-secondary truncate max-w-[90px]">
              {neededRoles[0]}
              {neededRoles.length > 1 && ` 외 ${neededRoles.length - 1}`}
            </span>
          )}
          {daysLeft > 0 && !isUrgent && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              D-{daysLeft}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── 팀 카드 (합류 중) ── */

function TeamCard({
  href, title, description, coverSrc, myRole, creatorName,
}: {
  href: string
  title: string
  description: string
  coverSrc: string | null
  myRole: string | null
  creatorName: string | undefined
}) {
  return (
    <Link
      href={href}
      className="bg-surface-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col no-underline"
    >
      <div className="relative aspect-[16/9] bg-surface-sunken overflow-hidden">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={title}
            fill
            sizes="(max-width:640px) 100vw, 33vw"
            className="object-cover"
            quality={75}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-txt-disabled">
            <span className="text-3xl font-extrabold">{title.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-brand text-white px-2 py-0.5 rounded-full">
            <Users size={10} />
            팀원
          </span>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-txt-primary truncate mb-1">{title}</h3>
        <div className="flex items-center gap-1.5 mb-2 text-[11px] text-txt-tertiary flex-wrap">
          {myRole && (
            <span className="font-medium text-brand bg-brand-bg px-1.5 py-0.5 rounded-full">{myRole}</span>
          )}
          {creatorName && <span>by {creatorName}</span>}
        </div>
        <p className="text-xs text-txt-secondary line-clamp-2 flex-1">{description}</p>
      </div>
    </Link>
  )
}
