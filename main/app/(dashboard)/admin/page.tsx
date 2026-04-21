'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAdmin } from '@/src/hooks/useAdmin'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { useMyOperatorClubs } from '@/src/hooks/useMyOperatorClubs'
import { Card } from '@/components/ui/Card'
import type { LucideIcon } from 'lucide-react'
import {
  Users,
  Briefcase,
  Eye,
  FileText,
  Coffee,
  TrendingUp,
  UserPlus,
  ShieldX,
  ArrowRight,
  BarChart3,
  Gift,
  AlertCircle,
  Building2,
  RotateCcw,
  Wrench,
  Activity,
  Sparkles,
  Shield,
  GraduationCap,
  LayoutDashboard,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface AdminStats {
  totalUsers: number
  totalOpportunities: number
  activeOpportunities: number
  totalApplications: number
  recentUsers: number
  totalCoffeeChats: number
  totalViews: number
}

/**
 * 통합 Admin SaaS 허브.
 *
 * 3개 어드민 티어를 하나의 진입점으로 통합:
 *   - Platform Admin (is_admin JWT)
 *   - Institution Admin (institution_members.role='admin')
 *   - Club Admin (club_members.role IN ('owner','admin'))
 *
 * 각 유저는 보유한 티어에 해당하는 섹션만 봄. 3개 다 없으면 접근 거부.
 * 이 페이지는 read-only (링크·통계)라 안전. 실제 변경은 각 모듈 페이지에서.
 */
export default function AdminHubPage() {
  const router = useRouter()
  const { isAdmin: isPlatformAdmin, isLoading: isPlatformLoading } = useAdmin()
  const { isInstitutionAdmin, institution, isLoading: isInstitutionLoading } = useInstitutionAdmin()
  const { clubs: operatorClubs, isOperator, isLoading: isClubsLoading } = useMyOperatorClubs()

  const anyLoading = isPlatformLoading || isInstitutionLoading || isClubsLoading
  const hasAnyAdminAccess = isPlatformAdmin || isInstitutionAdmin || isOperator

  const { data: stats, isLoading: isStatsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    enabled: isPlatformAdmin,
    refetchInterval: 60000,
  })

  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const doResetOnboarding = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset-onboarding', { method: 'POST' })
      if (res.ok) router.push('/onboarding')
      else toast.error('리셋 실패')
    } finally {
      setResetting(false)
      setShowResetConfirm(false)
    }
  }
  const handleResetOnboarding = () => setShowResetConfirm(true)

  if (anyLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <div className="space-y-4 w-full max-w-xs">
          <div className="h-6 bg-surface-card rounded skeleton-shimmer w-40 mx-auto" />
          <div className="h-4 bg-surface-card rounded skeleton-shimmer w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!hasAnyAdminAccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-bg">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-primary font-semibold mb-1">접근 권한이 없습니다</p>
        <p className="text-[13px] text-txt-tertiary">
          플랫폼·기관·클럽 관리자 권한이 있어야 이 페이지를 볼 수 있습니다
        </p>
        <Link
          href="/dashboard"
          className="mt-5 px-4 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-full hover:opacity-90 transition-opacity"
        >
          대시보드로
        </Link>
      </div>
    )
  }

  // 역할 뱃지
  const roleBadges: Array<{ label: string; icon: LucideIcon; bg: string; text: string }> = []
  if (isPlatformAdmin) roleBadges.push({ label: '플랫폼 관리자', icon: Shield, bg: 'bg-brand-bg', text: 'text-brand' })
  if (isInstitutionAdmin) roleBadges.push({ label: '기관 관리자', icon: GraduationCap, bg: 'bg-status-info-bg', text: 'text-status-info-text' })
  if (isOperator) roleBadges.push({ label: `클럽 운영자 · ${operatorClubs.length}곳`, icon: Building2, bg: 'bg-status-success-bg', text: 'text-status-success-text' })

  const statCards = isPlatformAdmin ? [
    { label: 'TOTAL USERS', value: stats?.totalUsers ?? '-', icon: Users },
    { label: 'NEW USERS (7D)', value: stats?.recentUsers ?? '-', icon: UserPlus },
    { label: 'OPPORTUNITIES', value: stats?.totalOpportunities ?? '-', icon: Briefcase },
    { label: 'ACTIVE', value: stats?.activeOpportunities ?? '-', icon: TrendingUp },
    { label: 'APPLICATIONS', value: stats?.totalApplications ?? '-', icon: FileText },
    { label: 'COFFEE CHATS', value: stats?.totalCoffeeChats ?? '-', icon: Coffee },
    { label: 'TOTAL VIEWS', value: stats?.totalViews ?? '-', icon: Eye },
  ] : []

  const platformLinks = [
    { href: '/admin/metrics', label: 'KPI 대시보드', desc: '플랫폼 전체 지표 + 30일 trend', icon: BarChart3 },
    { href: '/admin/users', label: '사용자 관리', desc: '전체 사용자 조회·검색·삭제', icon: Users },
    { href: '/admin/opportunities', label: '프로젝트 관리', desc: '게시글 조회·필터·삭제', icon: Briefcase },
    { href: '/admin/institutions', label: '기관 관리', desc: '기관 CRUD·멤버 배정', icon: Building2 },
    { href: '/admin/invite-codes', label: '프리미엄 초대 코드', desc: '프리미엄 업그레이드 코드 발송', icon: Gift },
    { href: '/admin/error-logs', label: '에러 로그', desc: '시스템 에러 모니터링', icon: AlertCircle },
    { href: '/admin/activity', label: '활동 로그', desc: '전체 서비스 활동 타임라인', icon: Activity },
    { href: '/admin/incidents', label: '인시던트 관리', desc: '공개 /status 페이지 업데이트', icon: AlertCircle },
    { href: '/admin/audit', label: '감사 로그', desc: '모든 admin 작업 이력', icon: Shield },
    { href: '/admin/platform-admins', label: '플랫폼 관리자', desc: 'admin 부여·박탈 (superadmin)', icon: Shield },
  ]

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
            <LayoutDashboard size={12} />
            Admin · 통합 허브
          </div>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">관리자 대시보드</h1>
          <p className="text-txt-tertiary text-sm mt-1.5">
            보유하신 권한에 따라 플랫폼·기관·클럽 관리 도구가 표시됩니다
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {roleBadges.map(b => {
              const Icon = b.icon
              return (
                <span
                  key={b.label}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${b.bg} ${b.text}`}
                >
                  <Icon size={11} />
                  {b.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* ==================== PLATFORM ADMIN ==================== */}
        {isPlatformAdmin && (
          <>
            {/* Stats Grid */}
            <section>
              <div className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
                <Shield size={12} className="text-brand" />
                플랫폼 — 전체 지표
              </div>
              {isStatsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-20 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {statCards.map(stat => {
                    const Icon = stat.icon
                    return (
                      <Card key={stat.label} padding="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface-inverse rounded-lg flex items-center justify-center shrink-0">
                            <Icon size={18} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-2xl font-bold font-mono text-txt-primary tabular-nums">{stat.value}</div>
                            <div className="text-[10px] font-medium text-txt-tertiary">{stat.label}</div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </section>

            {/* 플랫폼 관리 도구 */}
            <section>
              <div className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
                <BarChart3 size={12} />
                플랫폼 관리 도구
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {platformLinks.map(link => {
                  const Icon = link.icon
                  return (
                    <Link key={link.href} href={link.href}>
                      <Card padding="p-5" className="group cursor-pointer hover-spring hover:border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-surface-sunken rounded-lg flex items-center justify-center group-hover:bg-surface-inverse transition-colors">
                              <Icon size={18} className="text-txt-secondary group-hover:text-txt-inverse transition-colors" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-txt-primary text-sm">{link.label}</h3>
                              <p className="text-xs text-txt-tertiary mt-0.5">{link.desc}</p>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {/* ==================== INSTITUTION ADMIN ==================== */}
        {isInstitutionAdmin && institution && (
          <section>
            <div className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
              <GraduationCap size={12} className="text-status-info-text" />
              기관 운영 — {institution.institutionName}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link href="/institution">
                <Card padding="p-5" className="group cursor-pointer hover-spring hover:border-status-info-text/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-status-info-bg rounded-lg flex items-center justify-center">
                        <LayoutDashboard size={18} className="text-status-info-text" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-txt-primary text-sm">기관 대시보드</h3>
                        <p className="text-xs text-txt-tertiary mt-0.5">멤버·팀·사업계획서·통계</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                  </div>
                </Card>
              </Link>
              <Link href="/institution/members">
                <Card padding="p-5" className="group cursor-pointer hover-spring hover:border-status-info-text/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-status-info-bg rounded-lg flex items-center justify-center">
                        <Users size={18} className="text-status-info-text" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-txt-primary text-sm">멤버 관리</h3>
                        <p className="text-xs text-txt-tertiary mt-0.5">학생·멘토 추가·역할 변경</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                  </div>
                </Card>
              </Link>
              <Link href="/institution/reports">
                <Card padding="p-5" className="group cursor-pointer hover-spring hover:border-status-info-text/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-status-info-bg rounded-lg flex items-center justify-center">
                        <BarChart3 size={18} className="text-status-info-text" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-txt-primary text-sm">성과 보고서</h3>
                        <p className="text-xs text-txt-tertiary mt-0.5">CSV·JSON 내보내기</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                  </div>
                </Card>
              </Link>
              <Link href="/institution/announce">
                <Card padding="p-5" className="group cursor-pointer hover-spring hover:border-status-info-text/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-status-info-bg rounded-lg flex items-center justify-center">
                        <Sparkles size={18} className="text-status-info-text" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-txt-primary text-sm">공지 일괄 발송</h3>
                        <p className="text-xs text-txt-tertiary mt-0.5">멤버 이메일 대량 발송</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                  </div>
                </Card>
              </Link>
            </div>
          </section>
        )}

        {/* ==================== CLUB OPERATOR ==================== */}
        {isOperator && (
          <section>
            <div className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
              <Building2 size={12} className="text-status-success-text" />
              운영 중인 클럽 — {operatorClubs.length}곳
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {operatorClubs.map(club => (
                // 중첩 <a> 회피: 외부는 div, 내부 Link 2개(KPI/설정)가 실제 a 태그
                <div key={club.slug}>
                  <Card padding="p-5" className="group hover-spring hover:border-status-success-text/30">
                    {/* 메인 진입: 로고+이름 클릭 = /operator */}
                    <Link
                      href={`/clubs/${club.slug}/operator`}
                      className="flex items-center gap-3 mb-3 no-underline"
                    >
                      {club.logo_url ? (
                        <Image src={club.logo_url} alt={club.name} width={40} height={40} className="rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-brand-bg flex items-center justify-center text-sm font-extrabold text-brand shrink-0">
                          {club.name[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-txt-primary text-sm truncate">{club.name}</h3>
                        <span className="text-[11px] font-semibold text-status-success-text">
                          {club.role === 'owner' ? '대표' : '운영진'}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-txt-disabled group-hover:text-txt-primary shrink-0" />
                    </Link>
                    <div className="flex items-center gap-3 pt-3 border-t border-border text-[11px] text-txt-tertiary">
                      <span>멤버 <span className="font-bold text-txt-primary tabular-nums">{club.member_count}</span></span>
                      {club.cohort && (
                        <>
                          <span className="text-border">·</span>
                          <span>{club.cohort}기</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3 text-[11px] text-txt-tertiary">
                      <Link
                        href={`/clubs/${club.slug}/reports`}
                        className="hover:text-brand transition-colors"
                      >
                        KPI 보고서
                      </Link>
                      <span className="text-border">·</span>
                      <Link
                        href={`/clubs/${club.slug}/settings`}
                        className="hover:text-brand transition-colors"
                      >
                        설정
                      </Link>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== DEV TOOLS (Platform admin only) ==================== */}
        {isPlatformAdmin && (
          <section>
            <div className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
              <Wrench size={12} />
              Dev Tools
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card padding="p-5" className="group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-sunken rounded-lg flex items-center justify-center">
                      <RotateCcw size={18} className="text-txt-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-txt-primary text-sm">온보딩 테스트</h3>
                      <p className="text-xs text-txt-tertiary mt-0.5">onboarding_completed 리셋 후 재진입</p>
                    </div>
                  </div>
                  <button
                    onClick={handleResetOnboarding}
                    disabled={resetting}
                    className="px-4 py-2 text-xs font-bold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {resetting ? '리셋 중...' : '리셋 & 테스트'}
                  </button>
                </div>
              </Card>
            </div>
          </section>
        )}
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={doResetOnboarding}
        title="온보딩 리셋 (테스트)"
        message="본인 계정의 온보딩 상태를 초기화합니다. personality·vision_summary 가 삭제되고 /onboarding 으로 이동합니다. 개발용 · 되돌릴 수 없습니다."
        confirmText={resetting ? '처리 중...' : '리셋하고 이동'}
        variant="warning"
      />
    </div>
  )
}
