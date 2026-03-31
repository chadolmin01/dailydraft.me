'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAdmin } from '@/src/hooks/useAdmin'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import {
  Users,
  Briefcase,
  Eye,
  FileText,
  Coffee,
  TrendingUp,
  UserPlus,
  Loader2,
  ShieldX,
  ArrowRight,
  BarChart3,
  Gift,
  AlertCircle,
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalOpportunities: number
  activeOpportunities: number
  totalApplications: number
  recentUsers: number
  totalCoffeeChats: number
  totalViews: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/explore')
    }
  }, [isAdmin, isAdminLoading, router])

  const { data: stats, isLoading, isError } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
    enabled: isAdmin,
    refetchInterval: 60000,
  })

  if (isAdminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-surface-sunken">
        <div className="space-y-4 w-full max-w-xs">
          <div className="h-6 bg-surface-card rounded skeleton-shimmer w-40 mx-auto" />
          <div className="h-4 bg-surface-card rounded skeleton-shimmer w-32 mx-auto" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-sunken">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">접근 권한이 없습니다</p>
      </div>
    )
  }

  const statCards = [
    { label: 'TOTAL USERS', value: stats?.totalUsers ?? '-', icon: Users, color: 'bg-black' },
    { label: 'NEW USERS (7D)', value: stats?.recentUsers ?? '-', icon: UserPlus, color: 'bg-surface-inverse' },
    { label: 'OPPORTUNITIES', value: stats?.totalOpportunities ?? '-', icon: Briefcase, color: 'bg-surface-inverse' },
    { label: 'ACTIVE', value: stats?.activeOpportunities ?? '-', icon: TrendingUp, color: 'bg-surface-inverse' },
    { label: 'APPLICATIONS', value: stats?.totalApplications ?? '-', icon: FileText, color: 'bg-surface-inverse' },
    { label: 'COFFEE CHATS', value: stats?.totalCoffeeChats ?? '-', icon: Coffee, color: 'bg-surface-inverse' },
    { label: 'TOTAL VIEWS', value: stats?.totalViews ?? '-', icon: Eye, color: 'bg-black' },
  ]

  const adminLinks = [
    { href: '/admin/users', label: '사용자 관리', desc: '전체 사용자 조회, 검색, 삭제', icon: Users },
    { href: '/admin/opportunities', label: 'Opportunity 관리', desc: '기회 게시글 조회, 필터, 삭제', icon: Briefcase },
    { href: '/admin/invite-codes', label: '초대 코드 관리', desc: '프리미엄 초대 코드 발송', icon: Gift },
    { href: '/admin/error-logs', label: '에러 로그', desc: '시스템 에러 모니터링', icon: AlertCircle },
  ]

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-sunken">
      <div className="max-w-[87.5rem] mx-auto p-8 lg:p-12 space-y-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <div className="text-[0.625rem] font-medium text-txt-tertiary mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-black" />
            Admin Dashboard
          </div>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">관리자 대시보드</h1>
          <p className="text-txt-tertiary text-sm mt-1">서비스 현황 및 관리 도구</p>
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
            <AlertCircle size={48} className="mx-auto text-status-danger-text/70 mb-4" />
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
                      <div className="text-[0.625rem] font-medium text-txt-tertiary">{stat.label}</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Quick Links */}
        <div>
          <div className="text-[0.625rem] font-medium text-txt-tertiary mb-4 flex items-center gap-2">
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
