'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { useMemo } from 'react'
import {
  Rocket, Users, MessageSquare, ArrowRight,
  Plus, Coffee, Sparkles, Inbox, CheckCircle2,
  TrendingUp, FileText,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { useMyOperatorClubs } from '@/src/hooks/useMyOperatorClubs'
import { supabase } from '@/src/lib/supabase/client'
import { useUnreadCount } from '@/src/hooks/useMessages'
import { useProjectInvitations } from '@/src/hooks/useProjectInvitations'
import { PageContainer } from '@/components/ui/PageContainer'
import PendingDraftCard from '@/components/dashboard/PendingDraftCard'
import { ProfileCompletionCard } from '@/components/dashboard/ProfileCompletionCard'
import { MicroPromptCard } from '@/components/onboarding/MicroPromptCard'
import { InterviewContinueCard } from '@/components/onboarding/InterviewContinueCard'
import { withRetry } from '@/src/lib/query-utils'

/**
 * Triage Home — index가 아니라 "오늘 당장 처리할 것" 중심의 워크스페이스.
 *
 * 철학:
 * - 통계 스트립·긴 목록을 홈에서 제거 → 사이드바·/my/*로 이관(MECE)
 * - 홈은 "action required" 를 모아 보여주는 Inbox 성격
 * - 운영자는 운영 지표 먼저, 비운영자는 Stage 1→3 nudge 먼저
 *
 * 레퍼런스: Notion Home 2024 (Recently Visited + @-mentions), Linear Inbox+Triage.
 */

function greeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '늦은 밤이네요'
  if (h < 12) return '좋은 아침입니다'
  if (h < 18) return '좋은 오후입니다'
  return '좋은 저녁입니다'
}

/**
 * onboarding_source 별 Dashboard 부제·비어있는 triage 힌트.
 * 각 유입 경로에 맞춰 "지금 당장 할 수 있는 것" 을 제시해서 dead-end 방지.
 */
type OnboardingSource = 'invite' | 'matching' | 'operator' | 'exploring' | null | undefined

function getSourceContext(source: OnboardingSource, isOperator: boolean): {
  subtitle: string
  emptyHint: { title: string; desc: string; href: string; cta: string }
} {
  // Operator role override — onboarding_source 가 뭐든 운영자면 운영 중심
  if (isOperator || source === 'operator') {
    return {
      subtitle: '오늘의 운영 현황을 한눈에',
      emptyHint: {
        title: '팀 현황·이번 주 업데이트를 점검해 보세요',
        desc: '운영 대시보드에서 팀별 제출 상태와 지원서 대기열을 모아서 봅니다.',
        href: '/clubs',
        cta: '내 클럽',
      },
    }
  }
  if (source === 'invite') {
    return {
      subtitle: '초대받은 클럽의 활동과 일정을 확인해 보세요',
      emptyHint: {
        title: '내 클럽에서 공지·일정·팀 목록 확인하기',
        desc: '가입한 클럽의 이번 주 활동과 기수별 아카이브를 바로 살펴볼 수 있습니다.',
        href: '/clubs',
        cta: '내 클럽',
      },
    }
  }
  if (source === 'matching') {
    return {
      subtitle: '관심사·스킬이 맞는 팀과 사람을 찾을 때입니다',
      emptyHint: {
        title: '지금 모집 중인 프로젝트 둘러보기',
        desc: 'AI 매칭 정렬로 내 스킬·관심사·성향과 궁합이 높은 팀을 우선 추천합니다.',
        href: '/explore?sort=ai',
        cta: '맞는 팀 찾기',
      },
    }
  }
  if (source === 'exploring') {
    return {
      subtitle: '둘러보기 좋은 날입니다',
      emptyHint: {
        title: '공개 프로젝트 피드 · 이번 주 활동',
        desc: '각 클럽이 이번 주에 뭘 했는지 피드로 빠르게 훑어볼 수 있습니다.',
        href: '/feed',
        cta: '피드 열기',
      },
    }
  }
  // source 없음 (레거시 유저) — 중립적 기본값
  return {
    subtitle: '',
    emptyHint: {
      title: '프로젝트·사람 탐색으로 시작해 보세요',
      desc: 'Draft 에 올라온 클럽·프로젝트·포트폴리오를 한 곳에서 살펴볼 수 있습니다.',
      href: '/explore',
      cta: '탐색 열기',
    },
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

// 주차 계산 — created_at 부터 몇 주째인지
function weekOf(createdAt: string | null | undefined): number {
  if (!createdAt) return 1
  return Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / (7 * 86_400_000)))
}

// 업데이트 마감까지 며칠 — 지난 업데이트 기준 7일이 마감선이라 가정
function daysTillDeadline(lastUpdateAt: string | null | undefined): number {
  if (!lastUpdateAt) return 0
  const daysSince = Math.floor((Date.now() - new Date(lastUpdateAt).getTime()) / 86_400_000)
  return 7 - daysSince
}

export default function DashboardClient() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { data: profile } = useProfile()
  const { data: myProjects = [] } = useMyOpportunities()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data: invitations = [] } = useProjectInvitations({ enabled: !!user })
  const { clubs: operatorClubs, isOperator, isLoading: isOperatorLoading } = useMyOperatorClubs()

  // 운영자 운영 지표 집계
  const { data: operatorMetrics } = useQuery<{ pendingApps: number; missingTeams: number }>({
    queryKey: ['operator-metrics', user?.id],
    queryFn: () => withRetry(async () => {
      const res = await fetch('/api/applications/pending-count')
      const { count } = res.ok ? await res.json() : { count: 0 }
      // 미제출 팀 수 — my projects 중 lastUpdate가 7일 넘은 것
      return { pendingApps: count ?? 0, missingTeams: 0 }
    }),
    enabled: !isAuthLoading && !!user && isOperator,
    staleTime: 1000 * 60 * 2,
  })

  // 다중 클럽 미제출 집계 — 운영 중인 클럽별 이번주 pending 팀 수
  const { data: operatorPending = [] } = useQuery<Array<{
    id: string
    slug: string
    name: string
    total_teams: number
    pending_count: number
  }>>({
    queryKey: ['operator-pending', user?.id],
    queryFn: () => withRetry(async () => {
      const res = await fetch('/api/users/operator-pending')
      if (!res.ok) return []
      const body = await res.json()
      return body.data ?? body ?? []
    }),
    enabled: !isAuthLoading && !!user && isOperator,
    staleTime: 1000 * 60 * 2,
  })

  // 마지막 활동 — My opportunities에서 최근 업데이트 있는 프로젝트 3개
  const { data: recentUpdates = [] } = useQuery<Array<{ opportunity_id: string; title: string; created_at: string | null }>>({
    queryKey: ['dashboard-recent-updates', user?.id],
    queryFn: async () => {
      if (!myProjects.length) return []
      const { data } = await supabase
        .from('project_updates')
        .select('opportunity_id, title, created_at')
        .in('opportunity_id', myProjects.map(p => p.id))
        .order('created_at', { ascending: false })
        .limit(5)
      return data ?? []
    },
    enabled: !isAuthLoading && !!user && myProjects.length > 0,
    staleTime: 1000 * 60 * 2,
  })

  // invitations 배열 참조가 매 렌더 바뀌면 triageItems useMemo 가 무효화 — 한 번만 필터.
  const pendingInvitations = useMemo(
    () => invitations.filter(i => i.status === 'pending'),
    [invitations],
  )

  // Today's triage — 오늘 반드시 처리할 것들
  const triageItems = useMemo(() => {
    const items: Array<{
      id: string
      priority: 'high' | 'mid' | 'low'
      icon: React.ReactNode
      title: string
      desc: string
      href: string
      cta: string
    }> = []

    // 운영자: 미제출 업데이트
    if (isOperator) {
      myProjects.forEach(proj => {
        const lastUpdate = recentUpdates.find(u => u.opportunity_id === proj.id)
        const daysLeft = daysTillDeadline(lastUpdate?.created_at ?? proj.created_at)
        if (daysLeft <= 2 && daysLeft >= -30) {
          items.push({
            id: `update-${proj.id}`,
            priority: daysLeft < 0 ? 'high' : 'mid',
            icon: <FileText size={14} />,
            title: daysLeft < 0
              ? `"${proj.title}" 업데이트 ${Math.abs(daysLeft)}일 지연`
              : `"${proj.title}" 업데이트 D-${daysLeft}`,
            desc: `${weekOf(proj.created_at)}주차 · 팀 회고를 남겨주세요`,
            href: `/projects/${proj.id}`,
            cta: '작성',
          })
        }
      })
    }

    // 운영자: 대기 지원서
    if (operatorMetrics && operatorMetrics.pendingApps > 0) {
      items.push({
        id: 'pending-apps',
        priority: 'high',
        icon: <Coffee size={14} />,
        title: `대기 중인 지원서 ${operatorMetrics.pendingApps}건`,
        desc: '응답을 기다리고 있습니다',
        href: '/projects',
        cta: '검토',
      })
    }

    // 팀 초대 응답 대기
    pendingInvitations.forEach(inv => {
      items.push({
        id: `inv-${inv.id}`,
        priority: 'mid',
        icon: <Users size={14} />,
        title: `팀 초대 도착 · ${inv.role}`,
        desc: `${timeAgo(inv.created_at)} · 수락 또는 거절`,
        href: '/notifications',
        cta: '확인',
      })
    })

    // 읽지 않은 메시지
    if (unreadCount > 0) {
      items.push({
        id: 'unread-msg',
        priority: 'mid',
        icon: <MessageSquare size={14} />,
        title: `읽지 않은 메시지 ${unreadCount}건`,
        desc: '새 대화가 도착했습니다',
        href: '/messages',
        cta: '열기',
      })
    }

    return items.sort((a, b) => {
      const prio = { high: 0, mid: 1, low: 2 }
      return prio[a.priority] - prio[b.priority]
    })
  }, [isOperator, myProjects, recentUpdates, operatorMetrics, pendingInvitations, unreadCount])

  return (
    <div className="bg-surface-bg min-h-full">
      <PageContainer size="wide" className="pt-6 pb-16">

        {/* Hero 인사 — onboarding_source 기반 부제 */}
        {(() => {
          const onboardingSource = (profile as (typeof profile & { onboarding_source?: string | null }) | undefined)?.onboarding_source as OnboardingSource
          const ctx = getSourceContext(onboardingSource, isOperator)
          return (
            <div className="mb-8">
              <p className="text-[13px] text-txt-tertiary mb-1 ob-stagger-item" style={{ ['--stagger' as string]: '20ms' }}>{greeting()}</p>
              <h1 className="text-[28px] sm:text-[32px] font-bold text-txt-primary tracking-tight ob-title-rise">
                {profile?.nickname ?? user?.email?.split('@')[0] ?? '...'}
              </h1>
              {isOperator ? (
                <p className="text-[14px] text-txt-secondary mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-bg text-brand rounded-full text-[11px] font-semibold">
                    <Sparkles size={10} /> 운영자
                  </span>
                  <span className="ml-2">{operatorClubs.length}개 클럽 · {myProjects.length}개 프로젝트 운영 중</span>
                </p>
              ) : ctx.subtitle ? (
                <p className="text-[14px] text-txt-secondary mt-1.5">{ctx.subtitle}</p>
              ) : null}
            </div>
          )
        })()}

        {/* ═══════════════════════════════════ */}
        {/* TRIAGE — 오늘 할 일                 */}
        {/* ═══════════════════════════════════ */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Inbox size={16} className="text-txt-primary" />
              <h2 className="text-[17px] font-bold text-txt-primary">오늘 할 일</h2>
              {triageItems.length > 0 && (
                <span className="text-[11px] font-bold text-brand bg-brand-bg px-2 py-0.5 rounded-full">
                  {triageItems.length}
                </span>
              )}
            </div>
          </div>
          <p className="text-[12px] text-txt-tertiary mb-4 leading-relaxed">
            받은 지원서·커피챗 요청·초대를 한 곳에 모아 드립니다. 오래 둘수록 상대방이 기다리게 되니 가급적 빨리 응답해 주세요.
          </p>

          {triageItems.length === 0 ? (
            (() => {
              const src = (profile as (typeof profile & { onboarding_source?: string | null }) | undefined)?.onboarding_source as OnboardingSource
              const ctx = getSourceContext(src, isOperator)
              return (
                <div className="bg-surface-card border border-border rounded-2xl p-8 text-center">
                  <CheckCircle2 size={28} className="text-status-success-text mx-auto mb-3" />
                  <p className="text-[15px] font-semibold text-txt-primary mb-1">모두 처리하셨습니다 👏</p>
                  <p className="text-[13px] text-txt-tertiary mb-4">받은 지원서·커피챗·초대가 모두 정리되었습니다.</p>
                  {/* Source-aware next step — dead-end 방지 */}
                  <Link
                    href={ctx.emptyHint.href}
                    className="ob-press-spring inline-flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse rounded-full text-[13px] font-bold"
                  >
                    {ctx.emptyHint.cta}
                    <ArrowRight size={13} />
                  </Link>
                  <p className="text-[11px] text-txt-tertiary mt-3 max-w-sm mx-auto">{ctx.emptyHint.desc}</p>
                </div>
              )
            })()
          ) : (
            <div className="space-y-2">
              {triageItems.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`ob-ring-glow ob-press-spring flex items-center gap-3 p-4 rounded-xl border group ${
                    item.priority === 'high'
                      ? 'bg-status-danger-bg/30 border-status-danger-text/20'
                      : item.priority === 'mid'
                      ? 'bg-surface-card border-border'
                      : 'bg-surface-card border-border opacity-80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.priority === 'high' ? 'bg-status-danger-text text-white'
                    : item.priority === 'mid' ? 'bg-brand-bg text-brand'
                    : 'bg-surface-sunken text-txt-tertiary'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-txt-primary truncate">{item.title}</p>
                    <p className="text-[12px] text-txt-tertiary">{item.desc}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[12px] font-semibold text-txt-secondary group-hover:text-brand transition-colors">
                    {item.cta}
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════ */}
        {/* OPERATOR METRICS — 운영자만          */}
        {/* ═══════════════════════════════════ */}
        {isOperator && operatorClubs.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-txt-primary" />
              <h2 className="text-[17px] font-bold text-txt-primary">운영 중인 클럽</h2>
            </div>
            <p className="text-[12px] text-txt-tertiary mb-4 leading-relaxed">
              승인 대기 중인 멤버가 있으면 운영자 페이지로, 아니면 일반 클럽 페이지로 이동합니다. 카드에 표시되는 숫자는 지금 확인이 필요한 항목입니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {operatorClubs.map(club => {
                const pending = operatorPending.find(p => p.slug === club.slug)
                return (
                  <Link
                    key={club.slug}
                    href={pending && pending.pending_count > 0 ? `/clubs/${club.slug}/operator` : `/clubs/${club.slug}`}
                    className="ob-ring-glow ob-press-spring bg-surface-card rounded-2xl border border-border p-5 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {club.logo_url ? (
                        <Image src={club.logo_url} alt={club.name} width={40} height={40} className="rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center text-sm font-extrabold text-brand shrink-0">
                          {club.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-[15px] text-txt-primary truncate">{club.name}</h3>
                          {pending && pending.pending_count > 0 && (
                            <span className="shrink-0 text-[10px] font-bold text-status-danger-text bg-status-danger-bg px-1.5 py-0.5 rounded-full">
                              미제출 {pending.pending_count}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-brand">
                          {club.role === 'owner' ? '대표' : '운영진'}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-txt-disabled group-hover:text-txt-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-border text-[12px]">
                      <div>
                        <span className="text-txt-tertiary">멤버</span>
                        <span className="ml-1 font-bold text-txt-primary tabular-nums">{club.member_count}</span>
                      </div>
                      {pending && pending.total_teams > 0 && (
                        <>
                          <span className="text-border">·</span>
                          <div>
                            <span className="text-txt-tertiary">팀</span>
                            <span className="ml-1 font-bold text-txt-primary tabular-nums">{pending.total_teams}</span>
                          </div>
                        </>
                      )}
                      {club.cohort && (
                        <>
                          <span className="text-border">·</span>
                          <div>
                            <span className="text-txt-tertiary">기수</span>
                            <span className="ml-1 font-bold text-txt-primary">{club.cohort}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
              {/* 새 클럽 만들기 카드 — 운영자도 추가 가능 */}
              <Link
                href="/clubs/new"
                className="bg-surface-card rounded-2xl border border-dashed border-border p-5 flex items-center justify-center gap-2 text-[13px] font-semibold text-txt-tertiary hover:text-brand hover:border-brand hover:bg-brand-bg transition-colors"
              >
                <Plus size={16} />
                새 클럽 만들기
              </Link>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════ */}
        {/* NON-OPERATOR NUDGE — Stage 1→3 유도 */}
        {/* 잔상 방지: isOperator는 async 로딩되므로 초기값 false → 운영자도 잠깐 깜빡임.
            isOperatorLoading=true 인 동안엔 렌더 보류 (안정화 후 확정 렌더). */}
        {/* ═══════════════════════════════════ */}
        {!isOperatorLoading && !isOperator && (
          <section className="mb-10">
            <div className="bg-surface-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
                  <Rocket size={18} className="text-brand" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-brand">Draft 시작하기</p>
                  <h3 className="text-[17px] font-bold text-txt-primary">3단계면 운영 준비 끝</h3>
                </div>
              </div>

              <ol className="space-y-2 mb-4">
                {[
                  { step: 1, label: '클럽 만들기', href: '/clubs/new', desc: 'Discord 연결·페르소나 1회 세팅' },
                  { step: 2, label: '프로젝트 추가', href: '/projects/new', desc: '모집 공고 템플릿으로 공고 작성' },
                  { step: 3, label: '팀원 초대', href: '/clubs', desc: 'QR·초대 코드·카톡 템플릿 공유' },
                ].map(item => (
                  <Link
                    key={item.step}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-sunken transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center text-[12px] font-bold text-brand shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-txt-primary">{item.label}</p>
                      <p className="text-[12px] text-txt-tertiary">{item.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </ol>

              <div className="pt-3 border-t border-border flex items-center justify-between text-[12px]">
                <span className="text-txt-tertiary">둘러보고 싶다면</span>
                <Link href="/explore" className="text-brand font-semibold hover:underline">
                  기존 프로젝트 탐색 →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════ */}
        {/* PROFILE COMPLETION                  */}
        {/* ═══════════════════════════════════ */}
        <section className="mb-6">
          <ProfileCompletionCard />
        </section>

        {/* ═══════════════════════════════════ */}
        {/* MICRO PROMPT (Ambient data collection) */}
        {/* AI 인터뷰 미완료 유저에게만. MicroPromptCard 자체가
            - 이미 답한 질문은 자동 스킵
            - 하루 2개 쿨다운
            - 답이 남은 질문이 없으면 null 반환 — 조건부 렌더링 불필요. */}
        {/* ═══════════════════════════════════ */}
        {!profile?.ai_chat_completed && (
          <>
            {/* 이벤트 게이트: 임계치(3/7) 이상 답했으면 "이어가기" 카드 우선 노출.
                미달이면 null 반환 → MicroPromptCard 로 계속 1문항 수집. */}
            <InterviewContinueCard />
            <section className="mb-6">
              <MicroPromptCard slot="sidebar" dismissible />
            </section>
          </>
        )}

        {/* ═══════════════════════════════════ */}
        {/* PENDING DRAFTS                      */}
        {/* ═══════════════════════════════════ */}
        <section className="mb-10">
          <PendingDraftCard />
        </section>

        {/* 발견/추천은 /explore의 역할. Dashboard는 "내 활동"에만 집중.
            탐색 입구는 비운영자 Nudge 하단의 "기존 프로젝트 탐색 →" 링크와 TopNavbar로 제공. */}

      </PageContainer>
    </div>
  )
}
