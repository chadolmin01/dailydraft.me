'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { Card } from '@/components/ui/Card'
import {
  FileText,
  Loader2,
  ShieldX,
  ChevronLeft,
  User,
  Calendar,
  BarChart3,
} from 'lucide-react'

interface MemberPlanData {
  name: string
  major: string | null
  skills: string[]
  teamCount: number
  businessPlanCount: number
  joinedAt: string
}

export default function InstitutionBusinessPlansPage() {
  const router = useRouter()
  const { isInstitutionAdmin, institution, isLoading: isAdminLoading } = useInstitutionAdmin()

  useEffect(() => {
    if (!isAdminLoading && !isInstitutionAdmin) {
      router.push('/explore')
    }
  }, [isInstitutionAdmin, isAdminLoading, router])

  const { data: report, isLoading } = useQuery<{
    members: MemberPlanData[]
    stats: { businessPlans: number; teamsFormed: number }
  }>({
    queryKey: ['institution-report'],
    queryFn: async () => {
      const res = await fetch('/api/institution/reports')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: isInstitutionAdmin,
    select: (data) => ({
      members: data.members || [],
      stats: data.stats || { businessPlans: 0, teamsFormed: 0 },
    }),
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

  const members = report?.members || []
  const totalPlans = report?.stats?.businessPlans || 0
  const membersWithPlans = members.filter((m) => m.businessPlanCount > 0)
  const completionRate = members.length > 0
    ? Math.round((membersWithPlans.length / members.length) * 100)
    : 0

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Link
            href="/institution"
            className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-1 hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={12} />
            Institution Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">사업계획서 현황</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            {institution?.institutionName} · 예비창업패키지 등 사업계획서 작성 진행률
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card padding="p-5">
            <div className="text-3xl font-bold font-mono text-txt-primary">{totalPlans}</div>
            <div className="text-[10px] font-medium text-txt-tertiary mt-1">
              총 사업계획서
            </div>
          </Card>
          <Card padding="p-5">
            <div className="text-3xl font-bold font-mono text-txt-primary">{membersWithPlans.length}</div>
            <div className="text-[10px] font-medium text-txt-tertiary mt-1">
              작성 학생 수
            </div>
          </Card>
          <Card padding="p-5">
            <div className="text-3xl font-bold font-mono text-txt-primary">{completionRate}%</div>
            <div className="text-[10px] font-medium text-txt-tertiary mt-1">
              참여율
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card padding="p-6">
          <div className="text-[10px] font-medium text-txt-tertiary mb-3 flex items-center gap-2">
            <BarChart3 size={14} />
            학생별 사업계획서 작성 현황
          </div>
          <div className="w-full bg-surface-sunken rounded-xl border border-border h-3 mb-2">
            <div
              className="bg-black h-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-txt-tertiary">
            <span>{membersWithPlans.length}명 작성</span>
            <span>{members.length - membersWithPlans.length}명 미작성</span>
          </div>
        </Card>

        {/* Member Table */}
        <Card padding="p-0">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="font-medium text-sm tracking-tight text-txt-primary">학생별 상세</h3>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-14 bg-surface-sunken rounded skeleton-shimmer" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText size={48} className="mx-auto text-txt-disabled mb-4" />
              <p className="text-txt-secondary text-sm">소속 학생이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">이름</th>
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">학과</th>
                    <th className="text-center text-[10px] font-medium text-txt-tertiary px-5 py-3">사업계획서</th>
                    <th className="text-center text-[10px] font-medium text-txt-tertiary px-5 py-3">프로젝트</th>
                    <th className="text-left text-[10px] font-medium text-txt-tertiary px-5 py-3">주요 스킬</th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .sort((a, b) => b.businessPlanCount - a.businessPlanCount)
                    .map((member) => (
                      <tr key={`${member.name}-${member.joinedAt}`} className="border-b border-border hover:bg-surface-sunken transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-sm text-txt-primary">{member.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-txt-secondary">{member.major || '-'}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 font-mono font-bold text-sm
                            ${member.businessPlanCount > 0
                              ? 'bg-surface-inverse text-txt-inverse'
                              : 'bg-surface-sunken text-txt-disabled border border-border'
                            }`}
                          >
                            {member.businessPlanCount}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 font-mono font-bold text-sm
                            ${member.teamCount > 0
                              ? 'bg-surface-inverse text-txt-inverse'
                              : 'bg-surface-sunken text-txt-disabled border border-border'
                            }`}
                          >
                            {member.teamCount}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {member.skills.slice(0, 3).map((skill, j) => (
                              <span key={j} className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-sunken text-txt-secondary border border-border">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
