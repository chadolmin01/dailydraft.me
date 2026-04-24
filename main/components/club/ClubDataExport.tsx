'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Users } from 'lucide-react'
import { useClub } from '@/src/hooks/useClub'
import { toast } from 'sonner'

/**
 * 클럽 데이터 내보내기 섹션 — 멤버 CSV 등.
 * KPI 보고서는 `/clubs/[slug]/reports`, 기수 스냅샷은 cohort archive 에 이미 있음.
 * 여기는 운영진이 "원본 데이터" 를 그대로 받고 싶을 때.
 */
export function ClubDataExport({ slug }: { slug: string }) {
  const { data: club } = useClub(slug)
  const [includeContact, setIncludeContact] = useState(false)
  const [cohort, setCohort] = useState<string>('')

  const downloadMembers = async () => {
    const params = new URLSearchParams()
    if (cohort) params.set('cohort', cohort)
    if (includeContact) params.set('include_contact', '1')
    const qs = params.toString()
    try {
      const res = await fetch(`/api/clubs/${slug}/members/export${qs ? `?${qs}` : ''}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fromHeader = res.headers.get('Content-Disposition')?.match(/filename\*=UTF-8''([^;]+)/)?.[1]
      a.download = fromHeader ? decodeURIComponent(fromHeader) : `${club?.name ?? 'club'}_members.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('멤버 목록을 다운로드했습니다')
    } catch {
      toast.error('내보내기에 실패했습니다')
    }
  }

  const cohorts = club?.cohorts ?? []

  return (
    <section className="bg-surface-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
          <FileSpreadsheet size={18} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-txt-primary">데이터 내보내기</h2>
          <p className="text-[11px] text-txt-tertiary">
            학기말 보고·알럼나이 관리·회계 결산용 원본 데이터
          </p>
        </div>
      </div>

      <div className="bg-surface-bg border border-border rounded-xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-txt-secondary" />
          <p className="text-[13px] font-semibold text-txt-primary">멤버 목록 CSV</p>
        </div>

        {cohorts.length > 0 && (
          <div className="mb-3">
            <label className="text-[11px] font-semibold text-txt-secondary block mb-1">기수 필터</label>
            <select
              value={cohort}
              onChange={e => setCohort(e.target.value)}
              className="w-full px-3 py-2 text-[13px] bg-surface-card border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand/40"
            >
              <option value="">전체 기수</option>
              {[...cohorts].reverse().map(c => (
                <option key={c} value={c}>{c}기</option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-[12px] text-txt-secondary cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={includeContact}
            onChange={e => setIncludeContact(e.target.checked)}
            className="rounded"
          />
          이메일·SNS 링크 포함 (개인정보 처리 방침 준수 필요)
        </label>

        <button
          onClick={downloadMembers}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-[13px] font-semibold bg-surface-inverse text-txt-inverse rounded-xl hover:opacity-90 transition-opacity"
        >
          <Download size={13} />
          CSV 다운로드
        </button>
      </div>

      <p className="text-[11px] text-txt-tertiary">
        BOM 포함 UTF-8 CSV — Excel에서 바로 열립니다. Apple Numbers / Google Sheets 도 OK
      </p>
    </section>
  )
}
