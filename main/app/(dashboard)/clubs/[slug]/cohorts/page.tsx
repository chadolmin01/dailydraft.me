'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, Archive, Users, FolderOpen, GraduationCap,
  Calendar, ArrowRight, Loader2,
} from 'lucide-react'

/**
 * /clubs/[slug]/cohorts — 클럽의 모든 기수 인덱스.
 *
 * Draft 의 핵심 약속 "누적 기록"을 실제로 drilldown 가능하게 하는 진입점.
 * 이전엔 운영자가 과거 기수를 보려면 URL 직접 입력 (/cohorts/[cohort]/archive) 해야 했음.
 * 이제 한 페이지에 전 기수 요약 + 각 기수 archive 로 이동.
 */

interface CohortRow {
  cohort: string
  member_count: number
  active_count: number
  alumni_count: number
  first_joined_at: string | null
  last_joined_at: string | null
  project_count: number
  active_project_count: number
  status: 'ongoing' | 'graduated'
}

interface CohortsResponse {
  club: { id: string; name: string }
  cohorts: CohortRow[]
}

export default function ClubCohortsPage() {
  const params = useParams()
  const slug = params.slug as string

  const { data, isLoading, error } = useQuery<CohortsResponse>({
    queryKey: ['club-cohorts', slug],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${slug}/cohorts`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? 'failed')
      }
      const body = await res.json()
      return body.data ?? body
    },
    staleTime: 1000 * 60 * 2,
  })

  return (
    <div className="bg-surface-bg min-h-full">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <Link
          href={`/clubs/${slug}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors mb-5"
        >
          <ChevronLeft size={14} />
          {data?.club.name ?? '클럽'}
        </Link>

        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0">
            <Archive size={18} className="text-brand" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-txt-primary">기수 아카이브</h1>
            <p className="text-[13px] text-txt-tertiary mt-0.5 leading-relaxed">
              클럽의 역대 기수와 각 기수의 멤버·프로젝트를 한눈에. 운영 기록이 누적될수록 신규 멤버에게 연결되는 컨텍스트가 커집니다.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="py-24 text-center">
            <Loader2 size={18} className="animate-spin mx-auto text-txt-tertiary" />
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-status-danger-bg text-status-danger-text text-[13px]">
            {(error as Error).message}
          </div>
        )}

        {data && data.cohorts.length === 0 && (
          <div className="bg-surface-card border border-border rounded-2xl p-12 text-center">
            <Archive size={28} className="text-txt-disabled mx-auto mb-3" aria-hidden="true" />
            <p className="text-[15px] font-semibold text-txt-primary mb-1">아직 등록된 기수가 없습니다</p>
            <p className="text-[13px] text-txt-tertiary max-w-sm mx-auto leading-relaxed">
              멤버를 초대하실 때 기수(1기·2기 등)를 지정하시면 이 페이지에서 기수별로 정리됩니다.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {data?.cohorts.map(c => {
            const isGraduated = c.status === 'graduated'
            return (
              <Link
                key={c.cohort}
                href={`/clubs/${slug}/cohorts/${encodeURIComponent(c.cohort)}/archive`}
                className="ob-ring-glow ob-press-spring block bg-surface-card border border-border rounded-2xl p-5 group"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-[18px] font-bold text-txt-primary">
                        {c.cohort}기
                      </h2>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isGraduated
                          ? 'bg-surface-sunken text-txt-tertiary'
                          : 'bg-status-success-bg text-status-success-text'
                      }`}>
                        {isGraduated ? '졸업' : '진행 중'}
                      </span>
                    </div>
                    {(c.first_joined_at || c.last_joined_at) && (
                      <p className="text-[12px] text-txt-tertiary flex items-center gap-1">
                        <Calendar size={11} aria-hidden="true" />
                        {c.first_joined_at ? new Date(c.first_joined_at).toLocaleDateString('ko-KR') : '—'}
                        {c.last_joined_at && c.first_joined_at !== c.last_joined_at && (
                          <> ~ {new Date(c.last_joined_at).toLocaleDateString('ko-KR')}</>
                        )}
                      </p>
                    )}
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0"
                    aria-hidden="true"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border-subtle">
                  <Stat icon={Users} label="전체 멤버" value={c.member_count} />
                  <Stat
                    icon={GraduationCap}
                    label="알럼나이"
                    value={c.alumni_count}
                    hint={c.alumni_count > 0 ? `${Math.round((c.alumni_count / c.member_count) * 100)}% 졸업` : undefined}
                  />
                  <Stat
                    icon={FolderOpen}
                    label="프로젝트"
                    value={c.project_count}
                    hint={c.active_project_count > 0 ? `${c.active_project_count}개 진행 중` : undefined}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon, label, value, hint,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  hint?: string
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-0.5">
        <Icon size={10} aria-hidden="true" />
        {label}
      </div>
      <p className="text-[15px] font-bold text-txt-primary tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-txt-tertiary mt-0.5">{hint}</p>}
    </div>
  )
}
