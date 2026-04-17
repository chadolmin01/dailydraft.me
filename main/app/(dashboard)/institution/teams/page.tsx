'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { Card } from '@/components/ui/Card'
import {
  Handshake,
  ShieldX,
  ChevronLeft,
  Users,
  Calendar,
  FileText,
  Coffee,
  AlertTriangle,
} from 'lucide-react'

interface TeamData {
  id: string
  title: string
  creator: string
  memberCount: number
  status: string
  createdAt: string
  updateCount: number
  lastUpdateAt: string | null
  coffeeChatCount: number
}

function getInactiveDays(lastUpdateAt: string | null, createdAt: string): number {
  const lastActive = lastUpdateAt ? new Date(lastUpdateAt) : new Date(createdAt)
  return Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '활동 없음'
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return '오늘'
  if (days === 1) return '어제'
  if (days < 7) return `${days}일 전`
  if (days < 30) return `${Math.floor(days / 7)}주 전`
  return `${Math.floor(days / 30)}개월 전`
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

  const teams = report?.teams || []

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[87.5rem] mx-auto p-8 lg:p-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Link
            href="/institution"
            className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-1 hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={12} />
            Institution Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">팀 구성 현황</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            {institution?.institutionName} · 소속 학생이 만든 프로젝트 {teams.length}건
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="p-4">
            <div className="text-2xl font-bold font-mono text-txt-primary">{teams.length}</div>
            <div className="text-[10px] font-medium text-txt-tertiary">총 프로젝트</div>
          </Card>
          <Card padding="p-4">
            <div className="text-2xl font-bold font-mono text-txt-primary">
              {teams.filter((t) => t.status === 'active').length}
            </div>
            <div className="text-[10px] font-medium text-txt-tertiary">모집 중</div>
          </Card>
          <Card padding="p-4">
            <div className="text-2xl font-bold font-mono text-txt-primary">
              {teams.filter((t) => t.status === 'filled').length}
            </div>
            <div className="text-[10px] font-medium text-txt-tertiary">팀 완성</div>
          </Card>
          <Card padding="p-4">
            <div className={`text-2xl font-bold font-mono ${
              teams.filter((t) => getInactiveDays(t.lastUpdateAt, t.createdAt) >= 3).length > 0
                ? 'text-status-danger-text'
                : 'text-txt-primary'
            }`}>
              {teams.filter((t) => getInactiveDays(t.lastUpdateAt, t.createdAt) >= 3).length}
            </div>
            <div className="text-[10px] font-medium text-txt-tertiary">3일+ 비활동</div>
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
            {teams.map((team) => {
              const inactiveDays = getInactiveDays(team.lastUpdateAt, team.createdAt)
              const isInactive = inactiveDays >= 3
              return (
                <Card key={team.id} padding="p-5" className={`group hover:border-border ${isInactive ? 'border-status-danger-text/30' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 pr-4">
                      <h3 className="font-semibold text-sm text-txt-primary leading-tight">
                        {team.title}
                      </h3>
                      {isInactive && (
                        <span title={`${inactiveDays}일간 활동 없음`}>
                          <AlertTriangle size={14} className="text-status-danger-text shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium border ${STATUS_STYLES[team.status] || 'border-border text-txt-tertiary'}`}>
                      {STATUS_LABELS[team.status] || team.status}
                    </span>
                  </div>

                  {/* Activity Metrics */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-sunken text-[10px] font-mono text-txt-secondary">
                      <FileText size={10} />
                      위클리 {team.updateCount}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-sunken text-[10px] font-mono text-txt-secondary">
                      <Coffee size={10} />
                      커피챗 {team.coffeeChatCount}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-sunken text-[10px] font-mono text-txt-secondary">
                      <Users size={10} />
                      {team.memberCount}명
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-txt-tertiary">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {team.creator}
                    </span>
                    <span className={`flex items-center gap-1 ${isInactive ? 'text-status-danger-text' : ''}`}>
                      <Calendar size={12} />
                      {formatRelativeDate(team.lastUpdateAt) === '활동 없음'
                        ? `생성 ${new Date(team.createdAt).toLocaleDateString('ko-KR')}`
                        : `최근 활동 ${formatRelativeDate(team.lastUpdateAt)}`
                      }
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
