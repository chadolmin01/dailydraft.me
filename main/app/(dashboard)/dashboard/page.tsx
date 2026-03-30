'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Rocket, Users, MessageSquare, Eye, Bell, FolderOpen,
  ArrowRight, Plus, Coffee, Clock, Heart, Loader2,
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'
import { useMyOpportunities } from '@/src/hooks/useOpportunities'
import { useRecommendedOpportunities } from '@/src/hooks/useOpportunities'
import { useUnreadCount } from '@/src/hooks/useMessages'
import { useProjectInvitations } from '@/src/hooks/useProjectInvitations'
import { PageContainer } from '@/components/ui/PageContainer'
import { Section } from '@/components/ui/Section'
import { Skeleton } from '@/components/ui/Skeleton'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { withRetry } from '@/src/lib/query-utils'

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

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { data: profile } = useProfile()
  const { data: myProjects = [], isLoading: projectsLoading } = useMyOpportunities()
  const { data: recommended = [], isLoading: recLoading } = useRecommendedOpportunities(4)
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data: invitations = [] } = useProjectInvitations({ enabled: !!user })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => withRetry(async () => {
      const res = await fetch('/api/profile/stats')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    }),
    enabled: !isAuthLoading && !!user,
    staleTime: 1000 * 60 * 2,
  })

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-applications-count'],
    queryFn: () => withRetry(async () => {
      const res = await fetch('/api/applications/pending-count')
      if (!res.ok) return 0
      const json = await res.json()
      return json.count ?? 0
    }),
    enabled: !isAuthLoading && !!user,
    staleTime: 1000 * 60 * 2,
  })

  const pendingInvitations = invitations.filter(i => i.status === 'pending')
  const greeting = getGreeting()
  const statsData = stats?.data ?? stats

  return (
    <div className="bg-surface-bg min-h-full">
      {/* Welcome */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dashed border-border pb-6">
            <div>
              <p className="text-[0.625rem] text-txt-tertiary mb-1">{greeting}</p>
              <h1 className="text-xl font-bold text-txt-primary">
                {profile?.nickname ?? user?.email?.split('@')[0] ?? '...'}
              </h1>
            </div>
            <Link
              href="/projects/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-inverse text-txt-inverse text-sm font-bold border border-surface-inverse hover:opacity-90 active:scale-[0.97] transition-all"
            >
              <Plus size={16} />
              새 프로젝트
            </Link>
          </div>
        </PageContainer>
      </Section>

      {/* Stats */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <ScrollReveal>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-5 h-5 bg-surface-inverse text-txt-inverse flex items-center justify-center text-[0.5rem] font-bold font-mono">S</span>
            <span className="text-[0.625rem] font-medium text-txt-secondary">Stats Overview</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              index={1}
              label="내 프로젝트"
              value={projectsLoading ? null : myProjects.length}
              icon={<FolderOpen size={14} />}
              href="/projects"
            />
            <StatCard
              index={2}
              label="대기 중 지원"
              value={statsLoading ? null : pendingCount}
              icon={<Coffee size={14} />}
              alert={pendingCount > 0}
            />
            <StatCard
              index={3}
              label="읽지 않은 메시지"
              value={unreadCount}
              icon={<MessageSquare size={14} />}
              href="/messages"
              alert={unreadCount > 0}
            />
            <StatCard
              index={4}
              label="팀 연결"
              value={statsLoading ? null : (statsData?.connections ?? 0)}
              icon={<Users size={14} />}
            />
          </div>
          </ScrollReveal>
        </PageContainer>
      </Section>

      {/* Action Items */}
      {(pendingInvitations.length > 0 || pendingCount > 0) && (
        <Section spacing="sm" bg="transparent">
          <PageContainer size="wide">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-5 bg-status-danger-text text-white flex items-center justify-center text-[0.5rem] font-bold font-mono">!</span>
              <span className="text-[0.625rem] font-medium text-txt-secondary">Action Required</span>
            </div>
            <div className="space-y-2">
              {pendingCount > 0 && (
                <Link href="/projects" className="flex items-center justify-between bg-surface-card border border-border-strong p-4 hover:shadow-solid-sm hover-spring group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-status-warning-bg border border-indicator-trending/20 flex items-center justify-center">
                      <Coffee size={14} className="text-indicator-trending" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-txt-primary">대기 중인 지원서 {pendingCount}건</p>
                      <p className="text-[0.625rem] font-mono text-txt-tertiary">응답을 기다리고 있어요</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                </Link>
              )}
              {pendingInvitations.map((inv) => (
                <Link key={inv.id} href="/notifications" className="flex items-center justify-between bg-surface-card border border-border-strong p-4 hover:shadow-solid-sm hover-spring group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-bg border border-brand-border flex items-center justify-center">
                      <Users size={14} className="text-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-txt-primary">팀 초대가 도착했어요</p>
                      <p className="text-[0.625rem] font-mono text-txt-tertiary">{inv.role} 역할 · {timeAgo(inv.created_at)}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                </Link>
              ))}
            </div>
          </PageContainer>
        </Section>
      )}

      {/* Recommended + Recent Activity */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recommended Projects */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-brand text-white flex items-center justify-center text-[0.5rem] font-bold font-mono">R</span>
                  <span className="text-[0.625rem] font-medium text-txt-secondary">Recommended</span>
                </div>
                <Link href="/explore" className="text-[0.625rem] font-mono text-txt-tertiary hover:text-txt-primary transition-colors flex items-center gap-1">
                  전체보기 <ArrowRight size={10} />
                </Link>
              </div>
              {recLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-surface-card border border-border-strong p-5">
                      <Skeleton className="h-4 w-2/3 mb-3" />
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recommended.length === 0 ? (
                <div className="bg-surface-card border border-dashed border-border-strong p-8 text-center">
                  <Rocket size={24} className="text-txt-disabled mx-auto mb-2" />
                  <p className="text-sm text-txt-tertiary">프로필을 완성하면 맞춤 추천을 받을 수 있어요</p>
                  <Link href="/profile/edit" className="text-xs text-brand font-bold mt-2 inline-block hover:underline">프로필 완성하기</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommended.map((opp, index) => (
                    <div
                      key={opp.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/explore?project=${opp.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/explore?project=${opp.id}`) }}
                      style={{ animationDelay: `${index * 80}ms` }}
                      className="stagger-item bg-surface-card border border-border-strong p-5 cursor-pointer hover:shadow-solid-sm hover:-translate-y-0.5 hover-spring group relative"
                    >
                      <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-surface-inverse/15" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-txt-primary truncate">{opp.title}</h3>
                            {opp.status === 'active' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-status-success-bg text-status-success-text text-[0.5rem] font-bold border border-indicator-online/20 shrink-0">
                                <span className="w-1 h-1 bg-indicator-online animate-pulse" />
                                모집중
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-txt-secondary line-clamp-1 mb-2">{opp.description}</p>
                          {opp.needed_roles && opp.needed_roles.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[0.625rem] font-mono font-bold text-brand bg-brand-bg px-1.5 py-0.5 border border-brand-border">NEED</span>
                              {opp.needed_roles.slice(0, 3).map((role: string) => (
                                <span key={role} className="text-[0.625rem] bg-surface-sunken text-txt-secondary px-1.5 py-0.5 border border-border">{role}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 bg-surface-inverse text-txt-inverse flex items-center justify-center text-[0.5rem] font-bold font-mono">A</span>
                <span className="text-[0.625rem] font-medium text-txt-secondary">Activity</span>
              </div>
              <div className="bg-surface-card border border-border-strong p-5 relative">
                <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-surface-inverse/15" />
                {statsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-8 h-8 shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="h-3 w-24 mb-2" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (statsData?.recentActivity ?? []).length === 0 ? (
                  <div className="text-center py-6">
                    <Clock size={20} className="text-txt-disabled mx-auto mb-2" />
                    <p className="text-xs text-txt-tertiary">아직 활동 내역이 없어요</p>
                    <Link href="/explore" className="text-xs text-brand font-bold mt-1 inline-block hover:underline">둘러보기</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(statsData.recentActivity as Array<{ type: string; title: string; description: string; created_at: string }>).slice(0, 5).map((activity, i) => (
                      <div key={i} className="flex gap-3">
                        <div className={`w-8 h-8 shrink-0 flex items-center justify-center border ${
                          activity.type === 'application_accepted' ? 'bg-status-success-bg border-indicator-online/20' :
                          activity.type === 'connection' ? 'bg-brand-bg border-brand-border' :
                          'bg-surface-sunken border-border'
                        }`}>
                          {activity.type === 'application_accepted' ? <Heart size={12} className="text-status-success-text" /> :
                           activity.type === 'connection' ? <Users size={12} className="text-brand" /> :
                           activity.type === 'bookmark' ? <Eye size={12} className="text-txt-tertiary" /> :
                           <Bell size={12} className="text-txt-tertiary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-txt-primary">{activity.title}</p>
                          <p className="text-[0.625rem] text-txt-tertiary truncate">{activity.description}</p>
                          <p className="text-[0.625rem] font-mono text-txt-disabled mt-0.5">{timeAgo(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* My Projects */}
      <Section spacing="sm" bg="transparent">
        <PageContainer size="wide">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[#059669] text-white flex items-center justify-center text-[0.5rem] font-bold font-mono">P</span>
              <span className="text-[0.625rem] font-medium text-txt-secondary">My Projects</span>
            </div>
            {myProjects.length > 0 && (
              <Link href="/projects" className="text-[0.625rem] font-mono text-txt-tertiary hover:text-txt-primary transition-colors flex items-center gap-1">
                전체보기 <ArrowRight size={10} />
              </Link>
            )}
          </div>
          {projectsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-surface-card border border-border-strong p-5 flex items-center gap-4">
                  <Skeleton className="w-10 h-10 shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                </div>
              ))}
            </div>
          ) : myProjects.length === 0 ? (
            <div className="border border-dashed border-border-strong bg-surface-card p-8 text-center">
              <div className="w-12 h-12 bg-surface-sunken border border-border flex items-center justify-center mx-auto mb-3">
                <FolderOpen size={20} className="text-txt-disabled" />
              </div>
              <p className="text-sm font-bold text-txt-primary mb-1">아직 프로젝트가 없습니다</p>
              <p className="text-xs text-txt-tertiary mb-4">아이디어를 등록하고 함께할 팀원을 찾아보세요</p>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-surface-inverse text-txt-inverse text-sm font-bold border border-surface-inverse hover:opacity-90 active:scale-[0.97] transition-all"
              >
                <Rocket size={14} />
                첫 프로젝트 만들기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myProjects.slice(0, 3).map((opp, index) => (
                <Link
                  key={opp.id}
                  href={`/projects`}
                  style={{ animationDelay: `${index * 60}ms` }}
                  className="stagger-item bg-surface-card border border-border-strong p-4 flex items-center gap-4 hover:shadow-solid-sm hover:-translate-y-0.5 hover-spring group relative block"
                >
                  <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-surface-inverse/15" />
                  <div className="w-10 h-10 bg-surface-inverse flex items-center justify-center shrink-0">
                    <Rocket size={16} className="text-txt-inverse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-sm text-txt-primary truncate">{opp.title}</h3>
                      {opp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-status-success-bg text-status-success-text text-[0.5rem] font-bold border border-indicator-online/20 shrink-0">모집중</span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-surface-sunken text-txt-tertiary text-[0.5rem] font-bold border border-border shrink-0">마감</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[0.625rem] font-mono text-txt-tertiary">
                      {opp.views_count != null && opp.views_count > 0 && (
                        <span className="flex items-center gap-1"><Eye size={10} />{opp.views_count}</span>
                      )}
                      {opp.applications_count != null && opp.applications_count > 0 && (
                        <span className="flex items-center gap-1"><Users size={10} />{opp.applications_count}</span>
                      )}
                      {opp.interest_count != null && opp.interest_count > 0 && (
                        <span className="flex items-center gap-1"><Heart size={10} />{opp.interest_count}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </PageContainer>
      </Section>
    </div>
  )
}

function StatCard({ index, label, value, icon, href, alert }: {
  index: number
  label: string
  value: number | null
  icon: React.ReactNode
  href?: string
  alert?: boolean
}) {
  const content = (
    <div className={`bg-surface-card border border-border-strong shadow-sharp p-5 relative ${href ? 'cursor-pointer hover:shadow-solid-sm hover:-translate-y-0.5 hover-spring group' : ''}`}>
      <div className="absolute top-1 left-1 w-2 h-2 border-l border-t border-surface-inverse/20" />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[0.625rem] font-mono text-txt-disabled">{String(index).padStart(2, '0')}</span>
        <div className={`w-6 h-6 flex items-center justify-center ${alert ? 'text-status-danger-text' : 'text-txt-tertiary'}`}>
          {icon}
        </div>
      </div>
      <p className="text-[0.625rem] text-txt-tertiary mb-1">{label}</p>
      {value === null ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <p className={`text-2xl font-bold tabular-nums ${alert ? 'text-status-danger-text' : 'text-txt-primary'}`}>
          {value}
        </p>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'GOOD NIGHT'
  if (h < 12) return 'GOOD MORNING'
  if (h < 18) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
}
