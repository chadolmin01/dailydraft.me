'use client'

import Link from 'next/link'
import { Users, ChevronRight, FileText } from 'lucide-react'
import { useClubTeams, type ClubTeam } from '@/src/hooks/useClub'
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

export default function ClubTeamBoard({ slug }: { slug: string }) {
  const { data, isLoading } = useClubTeams(slug)
  // 뒤로가기 컨텍스트: 팀 구성 탭에서 진입했다는 정보를 쿼리에 실어 넘김.
  // projects/[id]는 ?from=을 읽어 헤더 뒤로가기 링크를 이 값으로 설정.
  const fromHref = `/clubs/${slug}?tab=teams`

  if (isLoading) {
    return <SkeletonGrid count={3} cols={1} />
  }

  if (!data || data.teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="등록된 팀이 없습니다"
        description="프로젝트를 추가하면 팀으로 표시됩니다"
      />
    )
  }

  const { teams, summary } = data

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
        />
      </div>

      {/* 팀 목록 */}
      <div className="space-y-3">
        {teams.map(team => (
          <TeamCard key={team.id} team={team} fromHref={fromHref} />
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ value, label, highlight, alert }: {
  value: number
  label: string
  highlight?: boolean
  alert?: boolean
}) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-4 text-center">
      <div className={`text-xl font-bold tabular-nums ${
        alert ? 'text-status-danger-text' :
        highlight ? 'text-status-success-text' :
        'text-txt-primary'
      }`}>
        {value}
      </div>
      <div className="text-[13px] text-txt-tertiary mt-0.5">{label}</div>
    </div>
  )
}

function TeamCard({ team, fromHref }: { team: ClubTeam; fromHref: string }) {
  const statusConfig = STATUS_CONFIG[team.update_status]

  // 모달(/explore?project=) 대신 풀스크린 관리 페이지로. 운영진이 주간 추적할 때는
  // URL/뒤로가기/새 탭이 필요한데 모달은 이걸 다 잃어버림.
  const href = `/projects/${team.id}?from=${encodeURIComponent(fromHref)}`

  return (
    <Link
      href={href}
      className="block bg-surface-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      {/* 헤더: 팀명 + 상태 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-[15px] font-bold text-txt-primary truncate">{team.title}</h3>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>
        <ChevronRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0" />
      </div>

      {/* 메타: 주차 + 업데이트 수 */}
      <div className="flex items-center gap-4 text-[13px] text-txt-tertiary mb-4">
        <span>{team.current_week}주차</span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1">
          <FileText size={12} />
          업데이트 {team.update_count}건
        </span>
        {team.latest_update && (
          <>
            <span className="text-border">·</span>
            <span>최근: {team.latest_update.title}</span>
          </>
        )}
      </div>

      {/* 멤버 목록 */}
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
        <span className="text-[13px] text-txt-tertiary ml-1">
          {team.members.slice(0, 3).map(m => {
            const pos = m.position ? POSITION_SHORT[m.position] : null
            return m.nickname ? (pos ? `${m.nickname}(${pos})` : m.nickname) : '?'
          }).join(', ')}
          {team.member_count > 3 && ` 외 ${team.member_count - 3}명`}
        </span>
      </div>
    </Link>
  )
}
