'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users, ChevronRight, FileText, Plus, AlertCircle } from 'lucide-react'
import { useClubTeams, useClub, type ClubTeam } from '@/src/hooks/useClub'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'

const STATUS_CONFIG = {
  complete: { label: '제출 완료', dot: 'bg-status-success-text', bg: 'bg-status-success-bg', text: 'text-status-success-text' },
  missing: { label: '미제출', dot: 'bg-indicator-trending', bg: 'bg-status-warning-bg', text: 'text-indicator-trending' },
  overdue: { label: '2주+ 미제출', dot: 'bg-status-danger-text', bg: 'bg-status-danger-bg', text: 'text-status-danger-text' },
} as const

const POSITION_SHORT: Record<string, string> = {
  developer: '개발',
  designer: '디자인',
  pm: '기획',
  marketer: '마케팅',
  data: '데이터',
}

type StatusFilter = 'all' | 'pending' | 'done'

export default function ClubTeamBoard({ slug }: { slug: string }) {
  const { data, isLoading } = useClubTeams(slug)
  const { data: club } = useClub(slug)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [cohortFilter, setCohortFilter] = useState<string | undefined>()

  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'
  const fromHref = `/clubs/${slug}?tab=teams`

  const filteredTeams = useMemo(() => {
    if (!data) return []
    return data.teams.filter(t => {
      if (cohortFilter && t.cohort !== cohortFilter) return false
      if (statusFilter === 'pending' && t.update_status === 'complete') return false
      if (statusFilter === 'done' && t.update_status !== 'complete') return false
      return true
    })
  }, [data, statusFilter, cohortFilter])

  if (isLoading) {
    return <SkeletonGrid count={3} cols={1} />
  }

  if (!data || data.teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="등록된 팀이 없습니다"
        description={isAdmin
          ? '프로젝트를 추가하면 팀으로 표시됩니다. Discord 채널 자동 생성도 함께 됩니다'
          : '프로젝트가 등록되면 팀으로 표시됩니다'}
        actionLabel={isAdmin && club ? '프로젝트 추가' : undefined}
        actionHref={isAdmin && club ? `/projects/new?club=${club.id}&from=/clubs/${slug}` : undefined}
      />
    )
  }

  const { teams, summary } = data
  const cohorts = club?.cohorts ?? []

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard value={summary.total_teams} label="전체 팀" />
        <SummaryCard
          value={summary.updated_this_week}
          label="이번 주 제출"
          highlight={summary.updated_this_week === summary.total_teams}
        />
        <SummaryCard
          value={summary.missing_updates}
          label="미제출"
          alert={summary.missing_updates > 0}
          onClick={summary.missing_updates > 0 ? () => setStatusFilter('pending') : undefined}
        />
      </div>

      {/* 필터 */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            전체 {teams.length}
          </FilterChip>
          <FilterChip active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')}>
            미제출 {teams.filter(t => t.update_status !== 'complete').length}
          </FilterChip>
          <FilterChip active={statusFilter === 'done'} onClick={() => setStatusFilter('done')}>
            제출 완료 {teams.filter(t => t.update_status === 'complete').length}
          </FilterChip>
        </div>

        {cohorts.length > 1 && (
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <FilterChip active={!cohortFilter} onClick={() => setCohortFilter(undefined)}>
              전체 기수
            </FilterChip>
            {[...cohorts].reverse().map(c => (
              <FilterChip key={c} active={cohortFilter === c} onClick={() => setCohortFilter(c)}>
                {c}기
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {/* 팀 목록 */}
      {filteredTeams.length === 0 ? (
        <div className="bg-surface-card border border-border rounded-2xl p-8 text-center">
          <p className="text-[14px] font-semibold text-txt-primary mb-1">조건에 맞는 팀이 없습니다</p>
          <p className="text-[12px] text-txt-tertiary">필터를 조정해보세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map(team => (
            <TeamCard key={team.id} team={team} fromHref={fromHref} isAdmin={isAdmin} />
          ))}

          {isAdmin && club && (
            <Link
              href={`/projects/new?club=${club.id}&from=/clubs/${slug}`}
              className="flex items-center justify-center gap-2 bg-surface-card rounded-xl border border-dashed border-border p-4 text-[13px] font-semibold text-txt-tertiary hover:text-brand hover:border-brand hover:bg-brand-bg transition-colors"
            >
              <Plus size={15} />
              팀 추가
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
        active
          ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
          : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
      }`}
    >
      {children}
    </button>
  )
}

function SummaryCard({ value, label, highlight, alert, onClick }: {
  value: number
  label: string
  highlight?: boolean
  alert?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <div className={`text-xl font-bold tabular-nums ${
        alert ? 'text-status-danger-text' :
        highlight ? 'text-status-success-text' :
        'text-txt-primary'
      }`}>
        {value}
      </div>
      <div className="text-[13px] text-txt-tertiary mt-0.5">{label}</div>
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="bg-surface-card border border-border rounded-xl p-4 text-center ob-ring-glow"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
      {content}
    </div>
  )
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function TeamCard({ team, fromHref, isAdmin }: { team: ClubTeam; fromHref: string; isAdmin: boolean }) {
  const statusConfig = STATUS_CONFIG[team.update_status]
  const href = `/projects/${team.id}?from=${encodeURIComponent(fromHref)}`

  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of team.members) {
      if (!m.position) continue
      const key = POSITION_SHORT[m.position] || m.position
      counts[key] = (counts[key] ?? 0) + 1
    }
    return Object.entries(counts)
  }, [team.members])

  const lastUpdateDays = team.latest_update ? daysSince(team.latest_update.created_at) : null

  return (
    <Link
      href={href}
      className="block bg-surface-card border border-border rounded-xl p-5 ob-ring-glow group"
    >
      {/* 헤더: 팀명 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-[15px] font-bold text-txt-primary truncate">{team.title}</h3>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>
        <ChevronRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0" />
      </div>

      {/* 메타: 주차 + 업데이트 */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[13px] text-txt-tertiary mb-3">
        <span>{team.current_week}주차</span>
        {team.cohort && (
          <>
            <span className="text-border">·</span>
            <span>{team.cohort}기</span>
          </>
        )}
        <span className="text-border">·</span>
        <span className="flex items-center gap-1">
          <FileText size={12} />
          업데이트 {team.update_count}건
        </span>
        {team.update_status !== 'complete' && lastUpdateDays !== null && (
          <>
            <span className="text-border">·</span>
            <span className={team.update_status === 'overdue' ? 'text-status-danger-text font-semibold' : ''}>
              마지막 업데이트 {lastUpdateDays}일 전
            </span>
          </>
        )}
        {team.update_status !== 'complete' && lastUpdateDays === null && (
          <>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1 text-indicator-trending">
              <AlertCircle size={12} />
              아직 업데이트 없음
            </span>
          </>
        )}
      </div>

      {/* 포지션 분포 */}
      {positionCounts.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {positionCounts.map(([pos, n]) => (
            <span
              key={pos}
              className="text-[11px] font-medium text-txt-secondary bg-surface-sunken px-2 py-0.5 rounded-full"
            >
              {pos} {n}
            </span>
          ))}
        </div>
      )}

      {/* 멤버 아바타 */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {team.members.slice(0, 6).map((m, i) => (
            <div
              key={m.user_id}
              className="w-8 h-8 rounded-full bg-surface-sunken border-2 border-surface-card flex items-center justify-center text-[11px] font-bold text-txt-secondary"
              style={{ zIndex: 10 - i }}
              title={`${m.nickname || '?'}${m.position ? ` · ${POSITION_SHORT[m.position] || m.position}` : ''}`}
            >
              {m.nickname?.[0] || '?'}
            </div>
          ))}
          {team.member_count > 6 && (
            <div className="w-8 h-8 rounded-full bg-surface-sunken border-2 border-surface-card flex items-center justify-center text-[10px] font-medium text-txt-tertiary">
              +{team.member_count - 6}
            </div>
          )}
        </div>
        <span className="text-[13px] text-txt-tertiary ml-1 truncate">
          {team.members.slice(0, 3).map(m => m.nickname || '?').join(', ')}
          {team.member_count > 3 && ` 외 ${team.member_count - 3}명`}
        </span>
      </div>

      {/* 운영자 전용 알림 CTA (미제출 팀만) */}
      {isAdmin && team.update_status !== 'complete' && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[11px] text-txt-tertiary">
            팀에 주간 업데이트를 요청하세요
          </span>
          <span className="text-[12px] font-semibold text-brand group-hover:underline">
            팀 페이지 열기 →
          </span>
        </div>
      )}
    </Link>
  )
}
