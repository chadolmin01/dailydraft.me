'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Settings, Users, FolderOpen, Archive, Share2, ChevronRight, ChevronLeft, Plus, Sparkles, UserPlus, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useClub, useClubMembers, useClubStats, useClubProjects, clubKeys } from '@/src/hooks/useClub'
import { timeAgo } from '@/src/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonGrid } from '@/components/ui/Skeleton'
import { useStaggerOnce } from '@/src/hooks/useStaggerOnce'
import ClubBotActivity from '@/components/club/ClubBotActivity'
import ClubTeamBoard from '@/components/club/ClubTeamBoard'
import { OperatorWelcomeModal } from '@/components/club/OperatorWelcomeModal'

function StaggerCard({ children, staggerKey, index }: { children: React.ReactNode; staggerKey: string; index: number }) {
  const cls = useStaggerOnce(staggerKey)
  return (
    <div className={cls} style={cls ? { animationDelay: `${Math.min(index * 50, 500)}ms` } : undefined}>
      {children}
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  owner: '대표',
  admin: '운영진',
  member: '멤버',
  alumni: '졸업',
}

type Tab = 'intro' | 'teams' | 'projects' | 'members' | 'archive' | 'activity'

export default function ClubPageClient() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const slug = params.slug as string
  const [activeTab, setActiveTab] = useState<Tab>('intro')
  const [memberCohort, setMemberCohort] = useState<string>()

  const { data: club, isLoading } = useClub(slug)
  const { data: stats } = useClubStats(slug)
  const { data: membersData } = useClubMembers(slug, { cohort: memberCohort, limit: 50 })
  const { data: clubProjects = [], isLoading: projectsLoading } = useClubProjects(club?.id)

  // 탭 호버 시 해당 탭에서 쓰는 API를 미리 fetch. 왜: intro 탭 외에는 탭 누른 순간 스켈레톤이
  // 꼭 보이는 구조였음. 호버 50~150ms에 미리 요청하면 클릭 시점엔 캐시에서 즉시 표시.
  const prefetchTab = useCallback((tab: Tab) => {
    if (tab === 'teams') {
      queryClient.prefetchQuery({
        queryKey: clubKeys.teams(slug),
        queryFn: async () => {
          const res = await fetch(`/api/clubs/${slug}/teams`)
          if (!res.ok) throw new Error('Teams fetch failed')
          return res.json()
        },
        staleTime: 1000 * 60 * 2,
      })
    } else if (tab === 'activity') {
      queryClient.prefetchQuery({
        queryKey: clubKeys.botActivity(slug),
        queryFn: async () => {
          const res = await fetch(`/api/clubs/${slug}/bot-activity`)
          if (!res.ok) throw new Error('Bot activity fetch failed')
          return res.json()
        },
        staleTime: 1000 * 60 * 5,
      })
    }
    // intro/projects/members/archive는 이미 page 로드 시 훅이 실행돼 캐시에 있음
  }, [queryClient, slug])

  // club.my_role은 서버에서 직접 조회한 값 — 멤버 페이지네이션(limit 50)에 의존하지 않음
  const isAdmin = club?.my_role === 'owner' || club?.my_role === 'admin'

  if (isLoading) {
    return (
      <div className="bg-surface-bg min-h-full">
        <div className="max-w-[1200px] mx-auto px-5 py-8">
          <div className="animate-pulse space-y-5">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-surface-sunken rounded-2xl" />
              <div className="flex-1 space-y-2.5">
                <div className="h-6 bg-surface-sunken rounded-full w-40" />
                <div className="h-4 bg-surface-sunken rounded-full w-64" />
              </div>
            </div>
            <div className="h-10 bg-surface-sunken rounded-full w-full" />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map(i => <div key={i} className="h-24 bg-surface-sunken rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="bg-surface-bg min-h-full">
        <div className="max-w-[1200px] mx-auto px-5 py-16 text-center">
          <p className="text-sm text-txt-tertiary">클럽을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const universityName = club.badges.find(b => b.type === 'university')?.university?.name

  const TABS = [
    { key: 'intro' as const, label: '소개' },
    { key: 'teams' as const, label: '팀 구성' },
    { key: 'projects' as const, label: '프로젝트' },
    { key: 'members' as const, label: '멤버' },
    { key: 'archive' as const, label: '아카이브' },
    ...(isAdmin ? [{ key: 'activity' as const, label: '봇 활동' }] : []),
  ]

  // 운영자 바로가기 — 클럽 내부 도구 모음. 상단 띠에 노출해 설정 페이지 들어가지 않고도
  // 자주 쓰는 운영 액션에 1클릭으로 접근.
  const operatorQuickLinks = isAdmin ? [
    { href: `/clubs/${slug}/settings`, icon: Settings, label: '설정' },
    { href: `/clubs/${slug}/settings/persona`, icon: Sparkles, label: '페르소나' },
    { href: `/projects/new?club=${club.id}&from=/clubs/${slug}`, icon: FolderOpen, label: '팀 추가' },
    { href: `/clubs/${slug}/settings#invite`, icon: UserPlus, label: '초대' },
    { href: `/clubs/${slug}?tab=teams`, icon: FileText, label: '주간 현황' },
  ] : []

  return (
    <div className="bg-surface-bg min-h-full">
      {/* 운영자 첫 진입 시 축하 모달 — owner/admin만 보고, localStorage로 1회 표시 */}
      {isAdmin && (
        <OperatorWelcomeModal clubSlug={slug} clubName={club.name} clubId={club.id} />
      )}
      <div className="max-w-[1200px] mx-auto px-5 pt-6 pb-16">

        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={16} />
            클럽 목록
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('링크가 복사되었습니다') }}
              className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
            >
              <Share2 size={14} />
              공유
            </button>
            {isAdmin && (
              <Link
                href={`/clubs/${slug}/settings`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-txt-secondary border border-border rounded-full hover:border-txt-tertiary transition-colors"
              >
                <Settings size={14} />
                설정
              </Link>
            )}
          </div>
        </div>

        {/* 운영자 전용 툴바 — owner/admin 일 때만. Progressive disclosure:
            멤버는 못 봄 → 일반 클럽 탐색자 UI 유지. 운영자는 여기서 자주 쓰는 액션 1클릭. */}
        {isAdmin && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <span className="shrink-0 text-[11px] font-semibold text-txt-tertiary uppercase tracking-wider mr-1">운영</span>
            {operatorQuickLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-txt-secondary bg-surface-card border border-border rounded-full hover:border-brand hover:text-brand hover:bg-brand-bg transition-colors"
              >
                <link.icon size={12} />
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Club Header */}
        <div className="flex items-start gap-5 mb-8">
          {club.logo_url ? (
            <Image src={club.logo_url} alt={club.name} width={72} height={72} className="rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-[72px] h-[72px] rounded-2xl bg-brand-bg flex items-center justify-center text-xl font-bold text-brand shrink-0">
              {club.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2.5 mb-1.5">
              <h1 className="text-[22px] font-bold text-txt-primary truncate">{club.name}</h1>
              {club.category && (
                <span className="shrink-0 text-xs font-semibold text-brand bg-brand-bg px-2.5 py-0.5 rounded-full">
                  {club.category}
                </span>
              )}
            </div>
            {club.description && (
              <p className="text-sm text-txt-secondary line-clamp-2 mb-2.5">{club.description}</p>
            )}
            <div className="flex items-center gap-2 text-[13px] text-txt-tertiary flex-wrap">
              {universityName && (
                <>
                  <span>{universityName}</span>
                  <span className="text-border">·</span>
                </>
              )}
              <span>멤버 {club.member_count}명</span>
              {club.cohorts.length > 0 && (
                <>
                  <span className="text-border">·</span>
                  <span>{club.cohorts[club.cohorts.length - 1]}기 운영 중</span>
                </>
              )}
              {stats && (
                <>
                  <span className="text-border">·</span>
                  <span>프로젝트 {stats.projects}개</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              onMouseEnter={() => prefetchTab(tab.key)}
              onFocus={() => prefetchTab(tab.key)}
              className={`relative shrink-0 px-3 py-2.5 text-[13px] md:px-5 md:py-3 md:text-[14px] font-semibold transition-colors min-h-[44px] ${
                activeTab === tab.key
                  ? 'text-txt-primary'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="club-tab-underline"
                  className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-txt-primary"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Contents */}

        {/* 소개 */}
        {activeTab === 'intro' && (
          <div className="space-y-8">
            {/* 멤버 아바타 */}
            {membersData && membersData.members.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {membersData.members.slice(0, 5).map((m, i) => (
                    <div
                      key={m.id}
                      className="w-8 h-8 rounded-full bg-surface-sunken border-2 border-surface-bg flex items-center justify-center text-[11px] font-bold text-txt-secondary"
                      style={{ zIndex: 5 - i }}
                    >
                      {m.nickname?.[0] || '?'}
                    </div>
                  ))}
                </div>
                <span className="text-[13px] text-txt-tertiary">
                  {membersData.members.slice(0, 3).map(m => m.nickname).join(', ')}
                  {club.member_count > 3 && ` 외 ${club.member_count - 3}명`}
                </span>
              </div>
            )}

            {/* 운영자 */}
            {club.owner.nickname && (
              <div>
                <h3 className="text-[15px] font-semibold text-txt-primary mb-3">운영</h3>
                <div className="flex items-center gap-3 bg-surface-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-10 h-10 rounded-full bg-brand-bg flex items-center justify-center text-sm font-bold text-brand shrink-0">
                    {club.owner.nickname[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-txt-primary">{club.owner.nickname}</div>
                    <div className="text-xs text-txt-tertiary">대표</div>
                  </div>
                </div>
              </div>
            )}

            {/* 활동 통계 */}
            {stats && (
              <div>
                <h3 className="text-[15px] font-semibold text-txt-primary mb-3">활동 요약</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: stats.projects, label: '프로젝트', key: 'stat-projects' },
                    { value: stats.updates, label: '주간 업데이트', key: 'stat-updates' },
                    { value: club.member_count, label: '멤버', key: 'stat-members' },
                  ].map((item, i) => (
                    <StaggerCard key={item.key} staggerKey={item.key} index={i}>
                      <div className="bg-surface-card border border-border rounded-xl p-5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className="text-[22px] font-bold text-txt-primary">{item.value}</div>
                        <div className="text-[13px] text-txt-tertiary mt-0.5">{item.label}</div>
                      </div>
                    </StaggerCard>
                  ))}
                </div>
              </div>
            )}

            {/* 관리자: 설정 바로가기 */}
            {isAdmin && (
              <Link
                href={`/clubs/${slug}/settings`}
                className="flex items-center gap-3 w-full p-5 bg-surface-card border border-border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left active:scale-[0.985]"
              >
                <Settings size={16} className="text-txt-tertiary" />
                <span className="text-sm font-semibold text-txt-primary">클럽 설정 관리</span>
                <ChevronRight size={14} className="text-txt-disabled ml-auto" />
              </Link>
            )}
          </div>
        )}

        {/* 팀 구성 */}
        {activeTab === 'teams' && (
          <ClubTeamBoard slug={slug} />
        )}

        {/* 프로젝트 */}
        {activeTab === 'projects' && (
          <div>
            {isAdmin && (
              <div className="flex justify-end mb-4">
                <Link
                  href={`/projects/new?club=${club.id}&from=/clubs/${slug}`}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand text-white rounded-xl hover:bg-brand-hover active:scale-[0.97] transition-all"
                >
                  <Plus size={15} />
                  프로젝트 추가
                </Link>
              </div>
            )}
            {projectsLoading ? (
              <SkeletonGrid count={3} cols={3} />
            ) : clubProjects.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="아직 등록된 프로젝트가 없습니다"
                description={isAdmin ? '프로젝트를 추가하고 Discord 채널을 연결하세요' : '프로젝트가 등록되면 여기에 표시됩니다'}
                actionLabel={isAdmin ? '프로젝트 추가' : undefined}
                actionHref={isAdmin ? `/projects/new?club=${club.id}&from=/clubs/${slug}` : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {clubProjects.map((p, i) => (
                  <StaggerCard key={p.id} staggerKey={`project:${p.id}`} index={i}>
                    <Link
                      href={`/explore?project=${p.id}`}
                      className="bg-surface-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full no-underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none active:scale-[0.985]"
                    >
                      <div className="p-5 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-[15px] font-bold text-txt-primary truncate">{p.title}</div>
                          {p.status === 'active' && (
                            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-status-success-text" />
                          )}
                        </div>
                        <div className="text-[13px] text-txt-secondary mb-3">
                          {p.needed_roles?.length > 0 ? `${p.needed_roles[0]} 모집 중` : p.status === 'active' ? '팀원 모집 중' : '마감'}
                        </div>
                        {p.interest_tags?.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {p.interest_tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs text-brand bg-brand-bg px-2 py-0.5 rounded-full font-medium">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-5 py-3 border-t border-border text-xs text-txt-tertiary">
                        {p.creator_nickname && <span>{p.creator_nickname}</span>}
                        {p.interest_count > 0 && (
                          <>
                            <span className="text-border">·</span>
                            <span>관심 {p.interest_count}</span>
                          </>
                        )}
                        {p.created_at && (
                          <>
                            <span className="text-border">·</span>
                            <span>{timeAgo(p.created_at)}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  </StaggerCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 멤버 */}
        {activeTab === 'members' && (
          <div>
            {/* 기수 필터 */}
            {club.cohorts.length > 0 && (
              <div className="flex gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => setMemberCohort(undefined)}
                  className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-all duration-200 ${
                    !memberCohort
                      ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                      : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
                  }`}
                >
                  전체
                </button>
                {[...club.cohorts].reverse().map(c => (
                  <button
                    key={c}
                    onClick={() => setMemberCohort(c)}
                    className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-all duration-200 ${
                      memberCohort === c
                        ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                        : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
                    }`}
                  >
                    {c}기
                  </button>
                ))}
              </div>
            )}

            {/* 멤버 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {(membersData?.members || []).map((m, i) => (
                <StaggerCard key={m.id} staggerKey={`member:${m.id}`} index={i}>
                  <div className="bg-surface-card border border-border rounded-xl p-5 flex flex-col items-center text-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    {m.avatar_url ? (
                      <Image src={m.avatar_url} alt={m.nickname || ''} width={48} height={48} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-brand-bg flex items-center justify-center text-[16px] font-bold text-brand">
                        {m.nickname?.[0] || '?'}
                      </div>
                    )}
                    <div className="text-[15px] font-bold text-txt-primary">{m.nickname || '익명'}</div>
                    <div className="text-[13px] text-txt-tertiary">
                      {m.display_role || ROLE_LABELS[m.role] || m.role}
                      {m.cohort && ` · ${m.cohort}기`}
                    </div>
                    {m.skills && m.skills.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {m.skills.slice(0, 2).map(s => (
                          <span key={s.name} className="text-xs text-brand bg-brand-bg px-2 py-0.5 rounded-full font-medium">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </StaggerCard>
              ))}
            </div>

            {membersData && membersData.members.length === 0 && (
              <EmptyState
                icon={Users}
                title="멤버가 없습니다"
              />
            )}
          </div>
        )}

        {/* 기수 아카이브 */}
        {activeTab === 'archive' && (
          <div>
            {club.cohorts.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="기수 정보가 없습니다"
              />
            ) : (
              <div className="space-y-3">
                {[...club.cohorts].reverse().map((cohort, idx) => {
                  const isLatest = idx === 0
                  const cohortCount = stats?.members.by_cohort[cohort] ?? 0
                  return (
                    <StaggerCard key={cohort} staggerKey={`cohort:${cohort}`} index={idx}>
                      <div className="bg-surface-card border border-border rounded-xl p-5 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLatest ? 'bg-status-success-text' : 'bg-border'}`} />
                          <span className="text-[15px] font-bold text-txt-primary">{cohort}기</span>
                          {isLatest && (
                            <span className="text-xs font-semibold text-status-success-text bg-status-success-bg px-2.5 py-0.5 rounded-full">
                              진행 중
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] text-txt-tertiary">멤버 {cohortCount}명</span>
                      </div>
                    </StaggerCard>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 봇 활동 — 관리자 전용 */}
        {activeTab === 'activity' && isAdmin && (
          <ClubBotActivity slug={slug} />
        )}
      </div>
    </div>
  )
}
