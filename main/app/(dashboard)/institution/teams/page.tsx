'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { Card } from '@/components/ui/Card'
import {
  Handshake,
  Loader2,
  ShieldX,
  ChevronLeft,
  ExternalLink,
  Users,
  Calendar,
} from 'lucide-react'

interface TeamData {
  id: string
  title: string
  creator: string
  memberCount: number
  status: string
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  active: 'border-status-success-text text-status-success-text bg-status-success-bg',
  closed: 'border-status-danger-text text-status-danger-text bg-status-danger-bg',
  filled: 'border-status-info-text text-status-info-text bg-status-info-bg',
}

const STATUS_LABELS: Record<string, string> = {
  active: '모집 중',
  closed: '마감',
  filled: '완료',
}

export default function InstitutionTeamsPage() {
  const router = useRouter()
  const { isInstitutionAdmin, institution, isLoading: isAdminLoading } = useInstitutionAdmin()

  useEffect(() => {
    if (!isAdminLoading && !isInstitutionAdmin) {
      router.push('/explore')
    }
  }, [isInstitutionAdmin, isAdminLoading, router])

  const { data: report, isLoading } = useQuery<{ teams: TeamData[] }>({
    queryKey: ['institution-report'],
    queryFn: async () => {
      const res = await fetch('/api/institution/reports')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: isInstitutionAdmin,
    select: (data) => ({ teams: data.teams || [] }),
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

  if (!isInstitutionAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-surface-sunken">
        <ShieldX size={48} className="text-status-danger-text/70 mb-4" />
        <p className="text-txt-secondary">기관 관리자 권한이 필요합니다</p>
      </div>
    )
  }

  const teams = report?.teams || []

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-sunken">
      <div className="max-w-[87.5rem] mx-auto p-8 lg:p-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <button
            onClick={() => router.push('/institution')}
            className="text-[0.625rem] font-medium text-txt-tertiary mb-2 flex items-center gap-1 hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={12} />
            Institution Dashboard
          </button>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">팀 구성 현황</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            {institution?.institutionName} · 소속 학생이 만든 프로젝트 {teams.length}건
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="p-4">
            <div className="text-2xl font-bold font-mono text-txt-primary">{teams.length}</div>
            <div className="text-[0.625rem] font-medium text-txt-tertiary">총 프로젝트</div>
          </Card>
          <Card padding="p-4">
            <div className="text-2xl font-bold font-mono text-txt-primary">
              {teams.filter((t) => t.status === 'active').length}
            </div>
            <div className="text-[0.625rem] font-medium text-txt-tertiary">모집 중</div>
          </Card>
          <Card padding="p-4">
            <div className="text-2xl font-bold font-mono text-txt-primary">
              {teams.filter((t) => t.status === 'filled').length}
            </div>
            <div className="text-[0.625rem] font-medium text-txt-tertiary">팀 완성</div>
          </Card>
        </div>

        {/* Teams List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-24 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <Card padding="p-12" className="text-center">
            <Handshake size={48} className="mx-auto text-txt-disabled mb-4" />
            <p className="text-txt-secondary text-sm">아직 생성된 팀이 없습니다</p>
            <p className="text-txt-tertiary text-xs mt-1">소속 학생들이 프로젝트를 만들면 여기에 표시됩니다</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <Card key={team.id} padding="p-5" className="group hover:border-border">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm text-txt-primary leading-tight pr-4">
                    {team.title}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 text-[0.5625rem] font-medium border ${STATUS_STYLES[team.status] || 'border-border text-txt-tertiary'}`}>
                    {STATUS_LABELS[team.status] || team.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-txt-tertiary">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {team.creator}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(team.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
