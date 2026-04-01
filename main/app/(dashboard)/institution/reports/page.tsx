'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useInstitutionAdmin } from '@/src/hooks/useInstitutionAdmin'
import { Card } from '@/components/ui/Card'
import type { InstitutionReport } from '@/src/types/institution'
import {
  Download,
  Loader2,
  ShieldX,
  ChevronLeft,
  FileText,
  FileSpreadsheet,
  Check,
} from 'lucide-react'

export default function InstitutionReportsPage() {
  const router = useRouter()
  const { isInstitutionAdmin, institution, isLoading: isAdminLoading } = useInstitutionAdmin()
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdminLoading && !isInstitutionAdmin) {
      router.push('/explore')
    }
  }, [isInstitutionAdmin, isAdminLoading, router])

  const { data: report, isLoading } = useQuery<InstitutionReport>({
    queryKey: ['institution-report'],
    queryFn: async () => {
      const res = await fetch('/api/institution/reports')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: isInstitutionAdmin,
  })

  // CSV cell escaping: prevent formula injection + escape double quotes
  const escapeCSV = (value: string) => {
    // Neutralize formula injection (Excel/Sheets interpret = + - @ as formulas)
    if (/^[=+\-@\t\r]/.test(value)) {
      value = "'" + value
    }
    // Escape internal double quotes per RFC 4180
    return `"${value.replace(/"/g, '""')}"`
  }

  // Sanitize filename for all OS (strip path separators and invalid chars)
  const sanitizeFilename = (s: string) => s.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')

  const downloadCSV = () => {
    if (!report) return
    setDownloading('csv')

    const headers = ['이름', '학과', '사업계획서 수', '프로젝트 수', '주요 스킬', '가입일']
    const rows = report.members.map((m) => [
      m.name,
      m.major || '',
      String(m.businessPlanCount),
      String(m.teamCount),
      m.skills.join(', '),
      new Date(m.joinedAt).toLocaleDateString('ko-KR'),
    ])

    const BOM = '\uFEFF'
    const csv = BOM + [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizeFilename(report.institution.name)}_활동보고서_${sanitizeFilename(report.period.replace(/\s/g, ''))}.csv`
    a.click()
    URL.revokeObjectURL(url)

    setTimeout(() => setDownloading(null), 1500)
  }

  const downloadJSON = () => {
    if (!report) return
    setDownloading('json')

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizeFilename(report.institution.name)}_활동보고서_${sanitizeFilename(report.period.replace(/\s/g, ''))}.json`
    a.click()
    URL.revokeObjectURL(url)

    setTimeout(() => setDownloading(null), 1500)
  }

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

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-surface-sunken">
      <div className="max-w-[87.5rem] mx-auto p-8 lg:p-12 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <button
            onClick={() => router.push('/institution')}
            className="text-[10px] font-medium text-txt-tertiary mb-2 flex items-center gap-1 hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={12} />
            Institution Dashboard
          </button>
          <h1 className="text-3xl font-bold text-txt-primary tracking-tight">활동 리포트</h1>
          <p className="text-txt-tertiary text-sm mt-1">
            {institution?.institutionName} · 정부 평가용 현황 보고서 생성
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-48 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-20 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
              <div className="h-20 bg-surface-card rounded-xl border border-border skeleton-shimmer" />
            </div>
          </div>
        ) : !report ? (
          <Card padding="p-12" className="text-center">
            <FileText size={48} className="mx-auto text-txt-disabled mb-4" />
            <p className="text-txt-secondary">리포트를 생성할 수 없습니다</p>
          </Card>
        ) : (
          <>
            {/* Report Preview */}
            <Card padding="p-8">
              <div className="text-[10px] font-medium text-txt-tertiary mb-6">
                {report.period} 활동 보고서
              </div>

              {/* Institution Info */}
              <div className="border-b border-border pb-4 mb-6">
                <h2 className="text-xl font-bold text-txt-primary">{report.institution.name}</h2>
                <p className="text-sm text-txt-secondary mt-1">{report.institution.university}</p>
              </div>

              {/* KPI Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <div className="text-3xl font-bold font-mono text-txt-primary">{report.stats.totalMembers}</div>
                  <div className="text-xs text-txt-secondary mt-1">소속 학생</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono text-txt-primary">{report.stats.teamsFormed}</div>
                  <div className="text-xs text-txt-secondary mt-1">창업팀 구성</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono text-txt-primary">{report.stats.businessPlans}</div>
                  <div className="text-xs text-txt-secondary mt-1">사업계획서 작성</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono text-txt-primary">{report.stats.applicationsCount}</div>
                  <div className="text-xs text-txt-secondary mt-1">팀원 지원</div>
                </div>
              </div>

              {/* Members Summary Table */}
              <div className="text-[10px] font-medium text-txt-tertiary mb-3">
                학생별 활동 요약
              </div>
              <div className="overflow-x-auto border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-sunken border-b border-border">
                      <th className="text-left text-[10px] font-medium text-txt-tertiary px-4 py-2">이름</th>
                      <th className="text-left text-[10px] font-medium text-txt-tertiary px-4 py-2">학과</th>
                      <th className="text-center text-[10px] font-medium text-txt-tertiary px-4 py-2">사업계획서</th>
                      <th className="text-center text-[10px] font-medium text-txt-tertiary px-4 py-2">프로젝트</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.members.map((m) => (
                      <tr key={`${m.name}-${m.joinedAt}`} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 text-sm text-txt-primary">{m.name}</td>
                        <td className="px-4 py-2 text-sm text-txt-secondary">{m.major || '-'}</td>
                        <td className="px-4 py-2 text-center text-sm font-mono">{m.businessPlanCount}</td>
                        <td className="px-4 py-2 text-center text-sm font-mono">{m.teamCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Download Options */}
            <div>
              <div className="text-[10px] font-medium text-txt-tertiary mb-4">
                내보내기
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  padding="p-5"
                  className="group cursor-pointer hover:border-border"
                  onClick={downloadCSV}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center group-hover:bg-black transition-colors">
                        <FileSpreadsheet size={18} className="text-txt-secondary group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-txt-primary text-sm">CSV 다운로드</h3>
                        <p className="text-xs text-txt-tertiary mt-0.5">Excel에서 열 수 있는 형식</p>
                      </div>
                    </div>
                    {downloading === 'csv' ? (
                      <Check size={16} className="text-status-success-text" />
                    ) : (
                      <Download size={16} className="text-txt-disabled group-hover:text-black transition-colors" />
                    )}
                  </div>
                </Card>

                <Card
                  padding="p-5"
                  className="group cursor-pointer hover:border-border"
                  onClick={downloadJSON}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center group-hover:bg-black transition-colors">
                        <FileText size={18} className="text-txt-secondary group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-txt-primary text-sm">JSON 다운로드</h3>
                        <p className="text-xs text-txt-tertiary mt-0.5">전체 데이터 (API 연동용)</p>
                      </div>
                    </div>
                    {downloading === 'json' ? (
                      <Check size={16} className="text-status-success-text" />
                    ) : (
                      <Download size={16} className="text-txt-disabled group-hover:text-black transition-colors" />
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
