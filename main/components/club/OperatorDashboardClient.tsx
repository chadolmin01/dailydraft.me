'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Activity, Users, FileText, CheckCircle2,
  AlertCircle, TrendingUp, MessageSquare, Sparkles, ArrowRight,
  Bell, Loader2, Mail,
} from 'lucide-react'
import { useClubTeams, useClubBotActivity, type ClubTeam } from '@/src/hooks/useClub'
import { PageContainer } from '@/components/ui/PageContainer'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { withRetry } from '@/src/lib/query-utils'
import { WeeklyRhythmCard } from '@/components/club/WeeklyRhythmCard'

type SortKey = 'status' | 'week' | 'updates' | 'name'

const POSITION_SHORT: Record<string, string> = {
  developer: '개발',
  designer: '디자인',
  pm: '기획',
  marketer: '마케팅',
  data: '데이터',
}

export default function OperatorDashboardClient({ slug, clubName }: { slug: string; clubName: string }) {
  const { data: teamsData, isLoading: teamsLoading } = useClubTeams(slug)
  const { data: botData } = useClubBotActivity(slug)
  const { data: discordStatus } = useQuery<{ connected: boolean; guild_name: string | null }>({
    queryKey: ['discord-status', slug],
    staleTime: 1000 * 60 * 10,
    queryFn: () => withRetry(async () => {
      const res = await fetch(`/api/clubs/${slug}/discord-status`)
      if (!res.ok) return { connected: false, guild_name: null }
      const body = await res.json()
      return body.data ?? body
    }),
  })
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [isReminding, setIsReminding] = useState(false)
  const [isDigesting, setIsDigesting] = useState(false)

  const pendingTeamIds = useMemo(() => {
    if (!teamsData) return [] as string[]
    return teamsData.teams
      .filter(t => t.update_status !== 'complete')
      .map(t => t.id)
  }, [teamsData])

  const handleSendDigest = async (testOnly: boolean) => {
    setIsDigesting(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/operator-digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_only: testOnly }),
      })
      const data = await res.json() as { data?: { sent?: number; message?: string }; error?: { message?: string } }
      if (!res.ok) {
        toast.error(data?.error?.message ?? '발송에 실패했습니다')
        return
      }
      const n = data.data?.sent ?? 0
      if (n > 0) {
        toast.success(`이메일 ${n}건이 전송되었습니다${testOnly ? ' (본인 미리보기)' : ''}`)
      } else {
        toast.info(data.data?.message ?? '발송된 메일이 없습니다')
      }
    } catch {
      toast.error('네트워크 오류')
    } finally {
      setIsDigesting(false)
    }
  }

  const handleRemindAll = async () => {
    if (pendingTeamIds.length === 0) return
    if (!confirm(`미제출 팀 ${pendingTeamIds.length}팀의 팀장에게 DM을 보낼까요? (24시간 내 중복 발송 방지)`)) return
    setIsReminding(true)
    try {
      const res = await fetch(`/api/clubs/${slug}/remind-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_ids: pendingTeamIds }),
      })
      if (!res.ok) throw new Error('요청 실패')
      const data = await res.json() as { sent: number; skipped: number; total: number }
      if (data.sent > 0) {
        toast.success(`${data.sent}팀에 리마인드를 보냈습니다${data.skipped > 0 ? ` · ${data.skipped}팀 생략` : ''}`)
      } else {
        toast.info('발송된 리마인드가 없습니다. 최근 24시간 내 이미 보냈을 수 있습니다')
      }
    } catch {
      toast.error('리마인드 발송에 실패했습니다')
    } finally {
      setIsReminding(false)
    }
  }

  const sortedTeams = useMemo(() => {
    if (!teamsData) return []
    const arr = [...teamsData.teams]
    const statusWeight = { overdue: 0, missing: 1, complete: 2 } as const
    arr.sort((a, b) => {
      if (sortKey === 'status') return statusWeight[a.update_status] - statusWeight[b.update_status]
      if (sortKey === 'week') return b.current_week - a.current_week
      if (sortKey === 'updates') return b.update_count - a.update_count
      return a.title.localeCompare(b.title, 'ko')
    })
    return arr
  }, [teamsData, sortKey])

  if (teamsLoading) {
    return (
      <PageContainer size="wide" className="pt-6 pb-16">
        <SkeletonGrid count={4} cols={2} />
      </PageContainer>
    )
  }

  const summary = teamsData?.summary
  const totalTeams = summary?.total_teams ?? 0
  const onTrack = summary?.updated_this_week ?? 0
  const missingAll = summary?.missing_updates ?? 0
  const overdue = teamsData?.teams.filter(t => t.update_status === 'overdue').length ?? 0
  const missingOnly = missingAll - overdue

  const completionRate = totalTeams > 0 ? Math.round((onTrack / totalTeams) * 100) : 0

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="wide" className="pt-6 pb-16">

        {/* 상단 네비 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/clubs/${slug}`}
            className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={16} />
            {clubName}으로
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSendDigest(true)}
              disabled={isDigesting}
              className="flex items-center gap-1 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors disabled:opacity-50"
              title="내 이메일로 미리보기 발송"
            >
              {isDigesting ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
              다이제스트 미리보기
            </button>
            <Link
              href={`/clubs/${slug}/reports`}
              className="text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
            >
              KPI 보고서
            </Link>
            <Link
              href={`/clubs/${slug}/settings`}
              className="text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
            >
              클럽 설정
            </Link>
          </div>
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-brand" />
            <p className="text-[12px] font-semibold text-brand">운영자 대시보드</p>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-txt-primary tracking-tight">
            팀 진행 현황
          </h1>
          <p className="text-[14px] text-txt-secondary mt-1.5">
            {clubName}의 모든 팀을 한눈에 비교하고 주간 현황을 추적합니다
          </p>
        </div>

        {/* Discord 미연결 안내 — 연결 시 자동 요약·봇 개입·활동 추적 활성화 */}
        {discordStatus && !discordStatus.connected && (
          <div className="mb-6 bg-surface-card border border-border rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
              <MessageSquare size={18} className="text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-txt-primary">
                Discord 연결로 자동화를 켜세요
              </p>
              <p className="text-[12px] text-txt-secondary mt-0.5">
                봇 설치 시 주간 요약 자동 생성, 대화 패턴 감지, 팀 활동 추적이 활성화됩니다
              </p>
              <Link
                href={`/clubs/${slug}/settings`}
                className="inline-flex items-center gap-1 mt-3 px-4 py-1.5 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 transition-opacity"
              >
                Discord 연결 설정
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* 이번 주 리듬 */}
        <WeeklyRhythmCard
          pendingTeams={pendingTeamIds.length}
          totalTeams={teamsData?.summary.total_teams ?? 0}
          submissionRate={
            (teamsData?.summary.total_teams ?? 0) > 0
              ? Math.round(((teamsData?.summary.updated_this_week ?? 0) / (teamsData?.summary.total_teams ?? 1)) * 100)
              : 0
          }
        />

        {/* 빠른 액션 */}
        {pendingTeamIds.length > 0 && (
          <div className="mb-6 bg-status-warning-bg border border-indicator-trending/20 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-warning-bg flex items-center justify-center">
                <AlertCircle size={18} className="text-indicator-trending" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-txt-primary">
                  이번 주 미제출 {pendingTeamIds.length}팀
                </p>
                <p className="text-[12px] text-txt-secondary">
                  팀장에게 원클릭으로 리마인드 DM을 보낼 수 있습니다
                </p>
              </div>
            </div>
            <button
              onClick={handleRemindAll}
              disabled={isReminding}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isReminding ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
              {isReminding ? '발송 중' : '일괄 리마인드'}
            </button>
          </div>
        )}

        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <KpiCard
            icon={<Users size={14} />}
            label="운영 중인 팀"
            value={totalTeams}
            hint={`${summary?.latest_week ?? 0}주차 진행 중`}
          />
          <KpiCard
            icon={<CheckCircle2 size={14} />}
            label="이번 주 제출률"
            value={`${completionRate}%`}
            hint={`${onTrack}/${totalTeams}팀 완료`}
            tone={completionRate >= 80 ? 'success' : completionRate >= 50 ? 'neutral' : 'alert'}
          />
          <KpiCard
            icon={<AlertCircle size={14} />}
            label="미제출"
            value={missingOnly}
            hint={missingOnly > 0 ? '리마인드 권장' : '모두 제출'}
            tone={missingOnly > 0 ? 'alert' : 'success'}
          />
          <KpiCard
            icon={<AlertCircle size={14} />}
            label="2주+ 지연"
            value={overdue}
            hint={overdue > 0 ? '1:1 미팅 권장' : '없음'}
            tone={overdue > 0 ? 'alert' : 'success'}
          />
        </div>

        {/* Discord 봇 활동 지표 */}
        {botData && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={15} className="text-txt-tertiary" />
              <h2 className="text-[14px] font-bold text-txt-primary">최근 30일 Discord 활동</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniStat label="봇 개입" value={botData.summary.total_interventions} />
              <MiniStat
                label="수락률"
                value={botData.summary.acceptance_rate !== null
                  ? `${Math.round((botData.summary.acceptance_rate ?? 0) * 100)}%`
                  : '—'}
              />
              <MiniStat label="의사결정" value={botData.summary.total_decisions} />
              <MiniStat label="공유 자료" value={botData.summary.total_resources} />
            </div>
          </div>
        )}

        {/* 팀 비교 테이블 */}
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-txt-tertiary" />
              <h2 className="text-[14px] font-bold text-txt-primary">팀별 비교</h2>
            </div>
            <div className="flex items-center gap-1 text-[12px]">
              <span className="text-txt-tertiary mr-1">정렬:</span>
              {(['status', 'week', 'updates', 'name'] as SortKey[]).map(k => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    sortKey === k
                      ? 'bg-brand-bg text-brand font-semibold'
                      : 'text-txt-tertiary hover:text-txt-primary'
                  }`}
                >
                  {k === 'status' ? '상태' : k === 'week' ? '주차' : k === 'updates' ? '기록량' : '이름'}
                </button>
              ))}
            </div>
          </div>

          {sortedTeams.length === 0 ? (
            <div className="p-10 text-center">
              <Sparkles size={28} className="text-txt-disabled mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-txt-primary mb-1">아직 등록된 팀이 없습니다</p>
              <p className="text-[12px] text-txt-tertiary">프로젝트를 추가하면 팀별 지표가 표시됩니다</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sortedTeams.map(team => (
                <OperatorTeamRow key={team.id} team={team} slug={slug} />
              ))}
            </ul>
          )}
        </div>

        {/* 인사이트 힌트 */}
        <div className="mt-6 bg-brand-bg border border-brand-border rounded-2xl p-4 flex gap-3">
          <Sparkles size={16} className="text-brand shrink-0 mt-0.5" />
          <div className="text-[13px] text-txt-secondary leading-relaxed">
            <p className="font-semibold text-txt-primary mb-1">이 화면을 언제 보면 좋을까요</p>
            <p>매주 월요일 오전, 팀 미팅 전 10분. 미제출/2주+ 지연 팀부터 직접 DM을 보내세요</p>
          </div>
        </div>

      </PageContainer>
    </div>
  )
}

function KpiCard({ icon, label, value, hint, tone = 'neutral' }: {
  icon: React.ReactNode
  label: string
  value: number | string
  hint: string
  tone?: 'neutral' | 'success' | 'alert'
}) {
  const toneClass = tone === 'success' ? 'text-status-success-text' : tone === 'alert' ? 'text-status-danger-text' : 'text-txt-primary'
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-1.5 text-txt-tertiary mb-2">
        {icon}
        <span className="text-[12px]">{label}</span>
      </div>
      <div className={`text-[26px] font-bold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-[11px] text-txt-disabled mt-1">{hint}</div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-surface-card border border-border rounded-xl p-3">
      <div className="text-[11px] text-txt-tertiary">{label}</div>
      <div className="text-[18px] font-bold text-txt-primary tabular-nums mt-0.5">{value}</div>
    </div>
  )
}

function OperatorTeamRow({ team, slug }: { team: ClubTeam; slug: string }) {
  const statusLabel = team.update_status === 'complete' ? '제출' : team.update_status === 'missing' ? '미제출' : '2주+ 지연'
  const statusTone = team.update_status === 'complete' ? 'bg-status-success-bg text-status-success-text'
    : team.update_status === 'missing' ? 'bg-status-warning-bg text-indicator-trending'
    : 'bg-status-danger-bg text-status-danger-text'

  const positions = team.members.reduce<Record<string, number>>((acc, m) => {
    if (!m.position) return acc
    const k = POSITION_SHORT[m.position] ?? m.position
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  const fromHref = `/clubs/${slug}/operator`

  return (
    <li>
      <Link
        href={`/projects/${team.id}?from=${encodeURIComponent(fromHref)}`}
        className="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-surface-sunken transition-colors group"
      >
        {/* 팀명 */}
        <div className="col-span-12 md:col-span-4 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusTone}`}>
              {statusLabel}
            </span>
            <p className="text-[14px] font-bold text-txt-primary truncate">{team.title}</p>
          </div>
          {team.cohort && (
            <p className="text-[11px] text-txt-tertiary mt-0.5">{team.cohort}기</p>
          )}
        </div>

        {/* 주차 */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[11px] text-txt-tertiary">주차</p>
          <p className="text-[14px] font-semibold text-txt-primary tabular-nums">{team.current_week}주차</p>
        </div>

        {/* 업데이트 */}
        <div className="col-span-4 md:col-span-2">
          <p className="text-[11px] text-txt-tertiary">업데이트</p>
          <p className="text-[14px] font-semibold text-txt-primary tabular-nums flex items-center gap-1">
            <FileText size={12} className="text-txt-tertiary" />
            {team.update_count}
          </p>
        </div>

        {/* 팀원 */}
        <div className="col-span-4 md:col-span-3 min-w-0">
          <p className="text-[11px] text-txt-tertiary">팀원 {team.member_count}명</p>
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            {Object.entries(positions).slice(0, 4).map(([pos, n]) => (
              <span key={pos} className="text-[10px] font-medium text-txt-secondary bg-surface-sunken px-1.5 py-0.5 rounded">
                {pos} {n}
              </span>
            ))}
            {Object.keys(positions).length === 0 && (
              <span className="text-[11px] text-txt-disabled">포지션 미기재</span>
            )}
          </div>
        </div>

        {/* arrow */}
        <div className="col-span-12 md:col-span-1 flex justify-end">
          <ArrowRight size={14} className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>
    </li>
  )
}
