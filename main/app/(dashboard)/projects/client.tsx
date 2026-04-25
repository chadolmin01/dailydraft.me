'use client'

import React, { useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { opportunityKeys, OPP_WITH_CREATOR_SELECT, type OpportunityWithCreator } from '@/src/hooks/useOpportunities'
import {
  Plus,
  FolderOpen,
  Users,
  Clock,
  ExternalLink,
  Settings,
  Rocket,
  ChevronRight,
  Eye,
  Heart,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import PendingDraftCard from '@/components/dashboard/PendingDraftCard'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { supabase } from '@/src/lib/supabase/client'
import { UPDATE_TYPE_CONFIG } from '@/components/project/types'
import type { Opportunity } from '@/src/types/opportunity'

/* ── Stage progress ── */
const STAGE_PROGRESS: Record<string, number> = {
  ideation: 20,
  design: 45,
  development: 70,
  launch: 100,
}

/* ── Types ── */
interface UpdateSummary {
  created_at: string
  update_type: string
  week_number: number
}

/* ── Batch dashboard data hook ── */
function useProjectsDashboard(projectIds: string[]) {
  const enabled = projectIds.length > 0

  const { data: teamCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['dashboard-teams', projectIds],
    queryFn: async () => {
      const { data } = await supabase
        .from('accepted_connections')
        .select('opportunity_id')
        .in('opportunity_id', projectIds)
        .eq('status', 'active')
      const counts: Record<string, number> = {}
      data?.forEach(d => {
        const oid = d.opportunity_id as string
        if (oid) counts[oid] = (counts[oid] || 0) + 1
      })
      return counts
    },
    enabled,
    staleTime: 2 * 60_000,
  })

  const { data: pendingCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['dashboard-pending', projectIds],
    queryFn: async () => {
      const { data } = await supabase
        .from('applications')
        .select('opportunity_id')
        .in('opportunity_id', projectIds)
        .eq('status', 'pending')
      const counts: Record<string, number> = {}
      data?.forEach(d => {
        const oid = d.opportunity_id as string | null
        if (oid) counts[oid] = (counts[oid] || 0) + 1
      })
      return counts
    },
    enabled,
    staleTime: 2 * 60_000,
  })

  const { data: updateData = { latest: {}, counts: {} } } = useQuery<{
    latest: Record<string, UpdateSummary>
    counts: Record<string, number>
  }>({
    queryKey: ['dashboard-updates', projectIds],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_updates')
        .select('opportunity_id, created_at, update_type, week_number')
        .in('opportunity_id', projectIds)
        .order('created_at', { ascending: false })
      const latest: Record<string, UpdateSummary> = {}
      const counts: Record<string, number> = {}
      data?.forEach(d => {
        const oid = d.opportunity_id as string
        if (!oid) return
        counts[oid] = (counts[oid] || 0) + 1
        if (!latest[oid]) latest[oid] = d as UpdateSummary
      })
      return { latest, counts }
    },
    enabled,
    staleTime: 2 * 60_000,
  })

  return {
    teamCounts,
    pendingCounts,
    latestUpdates: updateData.latest,
    updateCounts: updateData.counts,
  }
}

/* ── Helpers ── */
function daysSince(date: string | null): number {
  if (!date) return -1
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
}

function calcWeek(createdAt: string | null): number {
  if (!createdAt) return 1
  return Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (7 * 86_400_000)))
}

/* ── Overall Stats ── */
function OverallStats({
  projects,
  teamCounts,
  pendingCounts,
}: {
  projects: Opportunity[]
  teamCounts: Record<string, number>
  pendingCounts: Record<string, number>
}) {
  const active = projects.filter(p => (p.status ?? 'active') === 'active').length
  const totalTeam = Object.values(teamCounts).reduce((a, b) => a + b, 0)
  const totalPending = Object.values(pendingCounts).reduce((a, b) => a + b, 0)

  const stats = [
    { label: '전체', value: projects.length },
    { label: '모집중', value: active },
    { label: '팀원', value: totalTeam },
    { label: '대기 지원', value: totalPending, accent: totalPending > 0 },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map(({ label, value, accent }, i) => (
        <div
          key={label}
          className={`stagger-item rounded-2xl p-4 border ${
            accent ? 'bg-brand-bg border-brand-border' : 'bg-surface-card border-border'
          }`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div
            className={`text-2xl font-black tabular-nums leading-none mb-1 ${
              accent ? 'text-brand' : 'text-txt-primary'
            }`}
          >
            {value}
          </div>
          <div className={`text-xs font-medium ${accent ? 'text-brand/70' : 'text-txt-tertiary'}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Metric cell inside card ── */
function Metric({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: number
  suffix?: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-xl py-2.5 text-center ${accent ? 'bg-brand-bg' : 'bg-surface-sunken/50'}`}>
      <div
        className={`text-base font-bold tabular-nums leading-none ${
          accent ? 'text-brand' : 'text-txt-primary'
        }`}
      >
        {value}
        {suffix && (
          <span className={`text-[10px] font-medium ml-0.5 ${accent ? 'text-brand/60' : 'text-txt-tertiary'}`}>
            {suffix}
          </span>
        )}
      </div>
      <div className={`text-[10px] font-medium mt-0.5 ${accent ? 'text-brand/70' : 'text-txt-disabled'}`}>
        {label}
      </div>
    </div>
  )
}

/* ── Project Dashboard Card ── */
function ProjectDashboardCard({
  project,
  teamCount,
  pendingCount,
  latestUpdate,
  updateCount,
  index,
}: {
  project: Opportunity
  teamCount: number
  pendingCount: number
  latestUpdate: UpdateSummary | null
  updateCount: number
  index: number
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const week = latestUpdate?.week_number ?? calcWeek(project.created_at)
  const stage = latestUpdate ? UPDATE_TYPE_CONFIG[latestUpdate.update_type] : null
  const stageProgress = latestUpdate ? (STAGE_PROGRESS[latestUpdate.update_type] ?? 0) : 0
  const lastDays = latestUpdate ? daysSince(latestUpdate.created_at) : -1
  const isActive = (project.status ?? 'active') === 'active'
  const filledRoles = (project as Record<string, unknown>).filled_roles as string[] | null
  const neededRoles = project.needed_roles || []
  const href = `/projects/${project.id}`

  const goManage = () => router.push(href)

  // 왜 onMouseEnter에서 양쪽을 다 prefetch: Next.js Link가 아니라 div role=button이라
  // 라우트 JS 청크와 React Query 데이터 둘 다 수동으로 예열해야 클릭 후 매끄럽게 열림.
  // 안 하면 관리 페이지 진입 시 스켈레톤이 꼭 깜빡임.
  const handleHoverPrefetch = useCallback(() => {
    router.prefetch(href)
    queryClient.prefetchQuery({
      queryKey: opportunityKeys.detail(project.id),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('opportunities')
          .select(OPP_WITH_CREATOR_SELECT)
          .eq('id', project.id)
          .single()
        if (error) throw error
        return data as unknown as OpportunityWithCreator
      },
      staleTime: 1000 * 60 * 2,
    })
  }, [router, queryClient, project.id, href])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goManage}
      onMouseEnter={handleHoverPrefetch}
      onFocus={handleHoverPrefetch}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goManage()
        }
      }}
      style={{ animationDelay: `${Math.min(index * 80, 500)}ms` }}
      className="stagger-item bg-surface-card rounded-2xl border border-border hover:shadow-lg hover:border-brand/20 transition-all cursor-pointer group"
    >
      {/* ── Header ── */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-txt-primary leading-snug truncate group-hover:text-brand transition-colors">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs text-txt-tertiary font-medium">Week {week}</span>
              {stage ? (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${stage.badgeColor}`}>
                  {stage.label}
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-sunken text-txt-disabled border border-border">
                  시작 전
                </span>
              )}
              {lastDays >= 0 && (
                <span className="text-[11px] text-txt-disabled">
                  · {lastDays === 0 ? '오늘 업데이트' : `${lastDays}일 전 업데이트`}
                </span>
              )}
            </div>
          </div>
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-status-success-bg border border-status-success-text/20 text-status-success-text text-[11px] font-bold rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indicator-online animate-pulse" />
              모집중
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 bg-surface-sunken text-txt-tertiary text-[11px] font-bold rounded-full border border-border shrink-0">
              마감
            </span>
          )}
        </div>

        {/* Progress bar */}
        {stageProgress > 0 && (
          <div className="mt-3 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out bg-brand"
              style={{ width: `${stageProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Metrics ── */}
      <div className="grid grid-cols-4 gap-2 px-5 py-4">
        <Metric label="팀원" value={teamCount} suffix="명" />
        <Metric label="대기 지원" value={pendingCount} suffix="건" accent={pendingCount > 0} />
        <Metric label="조회" value={project.views_count ?? 0} />
        <Metric label="관심" value={project.interest_count ?? 0} />
      </div>

      {/* ── Roles ── */}
      {neededRoles.length > 0 && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {neededRoles.map(role => {
              const isFilled = filledRoles?.includes(role)
              return (
                <span
                  key={role}
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    isFilled
                      ? 'bg-status-success-bg text-status-success-text border-status-success-text/20 line-through opacity-60'
                      : 'bg-surface-sunken text-txt-secondary border-border'
                  }`}
                >
                  {isFilled && <CheckCircle2 size={10} />}
                  {role}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Alerts ── */}
      {pendingCount > 0 && (
        <div className="mx-5 mb-3 px-3 py-2 bg-brand-bg border border-brand-border rounded-xl flex items-center gap-2">
          <AlertCircle size={13} className="text-brand shrink-0" />
          <span className="text-xs font-medium text-brand">
            새 지원서 {pendingCount}건이 대기중입니다
          </span>
        </div>
      )}
      {isActive && updateCount > 0 && lastDays > 7 && pendingCount === 0 && (
        <div className="mx-5 mb-3 px-3 py-2 bg-status-warning-bg border border-status-warning-text/20 rounded-xl flex items-center gap-2">
          <Clock size={13} className="text-status-warning-text shrink-0" />
          <span className="text-xs font-medium text-status-warning-text">
            마지막 업데이트가 {lastDays}일 전입니다
          </span>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-t border-border">
        <Link
          href={`/projects/${project.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-xs font-bold rounded-xl hover:opacity-90 transition-all active:scale-[0.97]"
        >
          관리
          <ChevronRight size={12} />
        </Link>
        <Link
          href={`/projects/${project.id}/edit`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs font-medium text-txt-secondary rounded-xl hover:bg-surface-sunken transition-colors"
        >
          <Settings size={12} />
          수정
        </Link>
        <Link
          href={`/p/${project.id}`}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-txt-tertiary hover:text-txt-primary transition-colors ml-auto"
        >
          공개 페이지
          <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  )
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 bg-surface-sunken rounded-full flex items-center justify-center mb-5 empty-float">
        <FolderOpen size={26} className="text-txt-tertiary" strokeWidth={1.5} />
      </div>
      <h3 className="text-[17px] font-black text-txt-primary mb-2">아직 참여한 프로젝트가 없습니다</h3>
      <p className="text-[13px] text-txt-tertiary mb-6 leading-relaxed max-w-sm">
        프로젝트를 만들어 팀원을 모집하거나, 탐색에서 이미 진행 중인 프로젝트에 지원할 수 있습니다.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-surface-inverse text-txt-inverse text-[14px] font-bold rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
        >
          <Rocket size={15} />
          프로젝트 만들기
        </Link>
        <Link
          href="/explore"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-txt-primary text-[14px] font-semibold rounded-full hover:border-txt-tertiary transition-colors"
        >
          이미 있는 프로젝트 둘러보기
        </Link>
      </div>
      <p className="text-[11px] text-txt-tertiary mt-5 leading-relaxed max-w-sm">
        처음이신가요? <Link href="/guide" className="text-brand underline">시작 가이드</Link>에서
        프로젝트를 작성하는 요령을 확인하실 수 있습니다.
      </p>
    </div>
  )
}

/* ── Page ── */
export default function MyProjectsClient() {
  const { data: myProjects = [], isLoading } = useMyOpportunities()
  const projectIds = useMemo(() => myProjects.map(p => p.id), [myProjects])
  const { teamCounts, pendingCounts, latestUpdates, updateCounts } =
    useProjectsDashboard(projectIds)

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-txt-primary tracking-tight">프로젝트</h1>
          <Link
            href="/projects/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-inverse text-txt-inverse text-[13px] font-black rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
          >
            <Plus size={14} strokeWidth={2.5} />
            새 프로젝트
          </Link>
        </div>

        {/* AI 초안 대기 */}
        <div className="mb-6">
          <PendingDraftCard />
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonGrid count={3} cols={1} />
        ) : myProjects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <OverallStats
              projects={myProjects}
              teamCounts={teamCounts}
              pendingCounts={pendingCounts}
            />

            <div className="space-y-4">
              {myProjects.map((opp: Opportunity, index: number) => (
                <ProjectDashboardCard
                  key={opp.id}
                  project={opp}
                  teamCount={teamCounts[opp.id] || 0}
                  pendingCount={pendingCounts[opp.id] || 0}
                  latestUpdate={latestUpdates[opp.id] || null}
                  updateCount={updateCounts[opp.id] || 0}
                  index={index}
                />
              ))}
            </div>

            {/* Explore CTA */}
            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-xs text-txt-tertiary">다른 프로젝트도 둘러보세요</p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-full text-[13px] font-bold text-txt-secondary hover:border-txt-primary hover:text-txt-primary transition-all active:scale-[0.97]"
              >
                탐색하기 →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
