'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import type { InstitutionStats } from '@/src/types/institution'
import {
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  UserPlus,
  ShieldX,
  ArrowRight,
  BarChart3,
  Download,
  UserCheck,
  Handshake,
  Building2,
  Send,
} from 'lucide-react'

export default function InstitutionDashboardPage() {
  const router = useRouter()
  const { isInstitutionAdmin, institution, isLoading: isAdminLoading } = useInstitutionAdmin()

  useEffect(() => {
    if (!isAdminLoading && !isInstitutionAdmin) {
      router.push('/explore')
    }
  }, [isInstitutionAdmin, isAdminLoading, router])

  const { data: stats, isLoading, isError } = useQuery<InstitutionStats>({
    queryKey: ['institution-stats'],
    queryFn: async () => {
      const res = await fetch('/api/institution/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    enabled: isInstitutionAdmin,
    refetchInterval: 60000,
  })

  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-bg">
        <div className="space-y-4 w-full max-w-xs">
          <div className="h-6 bg-surface-card rounded skeleton-shimmer w-40 mx-auto" />
          <div className="h-4 bg-surface-card rounded skeleton-shimmer w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isInstitutionAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-bg">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">기관 관리자 권한이 필요합니다</p>
      </div>
    )
  }

  const statCards = [
    { label: 'TOTAL MEMBERS', value: stats?.totalMembers ?? '-', icon: Users, color: 'bg-black' },
    { label: 'STUDENTS', value: stats?.activeStudents ?? '-', icon: GraduationCap, color: 'bg-surface-inverse' },
    { label: 'MENTORS', value: stats?.mentors ?? '-', icon: UserCheck, color: 'bg-surface-inverse' },
    { label: 'TEAMS FORMED', value: stats?.teamsFormed ?? '-', icon: Handshake, color: 'bg-black' },
    { label: 'BUSINESS PLANS', value: stats?.businessPlans ?? '-', icon: FileText, color: 'bg-surface-inverse' },
    { label: 'ACTIVE PROJECTS', value: stats?.activeOpportunities ?? '-', icon: Briefcase, color: 'bg-surface-inverse' },
    { label: 'NEW (7D)', value: stats?.recentJoins ?? '-', icon: UserPlus, color: 'bg-surface-inverse' },
  ]

  const adminLinks = [
    {
      href: '/institution/members',
      label: '소속 학생 관리',
      desc: '학생 추가, 현황 조회, 역할 관리',
      icon: GraduationCap,
    },
    {
      href: '/institution/teams',
      label: '팀 구성 현황',
      desc: '학생들이 만든 프로젝트/팀 트래킹',
      icon: Handshake,
    },
    {
      href: '/institution/business-plans',
      label: '사업계획서 현황',
      desc: '예비창업패키지 등 사업계획서 작성 진행률',
      icon: FileText,
    },
    {
      href: '/institution/reports',
      label: '활동 리포트',
      desc: '정부 평가용 현황 보고서 생성 & 내보내기',
      icon: Download,
    },
    {
      href: '/institution/announce',
      label: '전체 공지 발송',
      desc: '소속 멤버 전체에게 이메일 공지 발송',
      icon: Send,
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-black" />
            Institution Dashboard
          </div>
          <div className="flex items-center gap-3 mb-1">
            <Building2 size={28} className="text-txt-primary" />
            <h1 className="text-3xl font-bold text-txt-primary tracking-tight">
              {institution?.institutionName || '기관 관리'}
            </h1>
          </div>
          <p className="text-txt-tertiary text-sm">소속 학생 현황 및 창업 활동 관리</p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i} className="h-20 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
            ))}
          </div>
        ) : isError ? (
          <Card padding="p-8" className="text-center">
            <BarChart3 size={48} className="mx-auto text-status-danger-text/70 mb-4" />
            <p className="text-txt-secondary">통계를 불러올 수 없습니다</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} padding="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${stat.color} flex items-center justify-center shrink-0`}>
                      <Icon size={18} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-2xl font-bold font-mono text-txt-primary">{stat.value}</div>
                      <div className="text-[10px] font-medium text-txt-tertiary">{stat.label}</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* KPI Highlights */}
        {stats && (
          <Card padding="p-6">
            <div className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
              <BarChart3 size={14} />
              KPI 요약
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-2 border-surface-inverse pl-4">
                <div className="text-3xl font-bold font-mono text-txt-primary">{stats.teamsFormed}</div>
                <div className="text-sm text-txt-secondary mt-1">창업팀 구성 수</div>
                <div className="text-[10px] text-txt-tertiary mt-0.5">정부 평가 핵심 지표</div>
              </div>
              <div className="border-l-2 border-surface-inverse pl-4">
                <div className="text-3xl font-bold font-mono text-txt-primary">{stats.businessPlans}</div>
                <div className="text-sm text-txt-secondary mt-1">사업계획서 작성</div>
                <div className="text-[10px] text-txt-tertiary mt-0.5">예비창업패키지 신청 준비</div>
              </div>
              <div className="border-l-2 border-surface-inverse pl-4">
                <div className="text-3xl font-bold font-mono text-txt-primary">{stats.applicationsCount}</div>
                <div className="text-sm text-txt-secondary mt-1">팀원 지원 수</div>
                <div className="text-[10px] text-txt-tertiary mt-0.5">활발한 팀빌딩 활동</div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Links */}
        <div>
          <div className="text-[10px] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
            <BarChart3 size={14} />
            관리 도구
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <Card padding="p-5" className="group cursor-pointer hover:border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center group-hover:bg-black transition-colors">
                          <Icon size={18} className="text-txt-secondary group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-txt-primary text-sm">{link.label}</h3>
                          <p className="text-xs text-txt-tertiary mt-0.5">{link.desc}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-txt-disabled group-hover:text-black transition-colors" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
