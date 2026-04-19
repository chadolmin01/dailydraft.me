'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, Download, Printer, Sparkles, BarChart3,
  Users, FolderOpen, CheckCircle2, MessageSquare, FileText,
  Target, Activity,
} from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { Skeleton } from '@/components/ui/Skeleton'
import { withRetry } from '@/src/lib/query-utils'
import { KpiTimeseriesChart } from './KpiTimeseriesChart'

interface KpiData {
  club: { id: string; name: string; slug: string; category: string | null; description: string | null }
  period: { start: string; end: string; weeks: number; cohort: string | null }
  counts: {
    projects_total: number
    projects_active: number
    projects_closed: number
    members_total: number
    members_admin: number
    updates_submitted: number
    submission_rate_percent: number
    decisions_total: number
    resources_shared: number
    tasks_total: number
    tasks_completed: number
    task_completion_rate_percent: number | null
    bot_interventions_total: number
    bot_acceptance_rate_percent: number | null
    discord_messages_total: number
    active_contributors: number
    avg_team_size: number
  }
  cohorts: Array<{ name: string; members: number; projects: number }>
  positions: Array<{ name: string; count: number }>
  stages: {
    ideation: number
    design: number
    development: number
    launch: number
    general: number
    not_started: number
  }
  timeseries?: Array<{ year: number; week: number; submissions: number; messages: number }>
  generated_at: string
}

const POSITION_LABEL: Record<string, string> = {
  developer: '개발',
  designer: '디자인',
  pm: '기획',
  marketer: '마케팅',
  data: '데이터',
  undecided: '미정',
  미기재: '미기재',
}

const STAGE_LABEL = {
  ideation: '아이디어',
  design: '설계',
  development: '구현',
  launch: '런칭',
  general: '일반',
  not_started: '미착수',
}

type RangePreset = '30d' | '90d' | 'semester' | 'year'

function datesForPreset(preset: RangePreset): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  if (preset === '30d') start.setDate(start.getDate() - 30)
  else if (preset === '90d') start.setDate(start.getDate() - 90)
  else if (preset === 'semester') start.setMonth(start.getMonth() - 6)
  else start.setFullYear(start.getFullYear() - 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

const PRESET_LABEL: Record<RangePreset, string> = {
  '30d': '최근 30일',
  '90d': '최근 3개월',
  semester: '최근 학기',
  year: '최근 1년',
}

export default function KpiReportClient({ slug, clubName }: { slug: string; clubName: string }) {
  const [preset, setPreset] = useState<RangePreset>('90d')
  const range = useMemo(() => datesForPreset(preset), [preset])

  const { data, isLoading } = useQuery<KpiData>({
    queryKey: ['club-kpi', slug, range.start, range.end],
    queryFn: () =>
      withRetry(async () => {
        const params = new URLSearchParams({ start: range.start, end: range.end })
        const res = await fetch(`/api/clubs/${slug}/reports/kpi?${params}`)
        if (!res.ok) throw new Error('KPI fetch failed')
        return res.json() as Promise<KpiData>
      }),
    staleTime: 1000 * 60 * 5,
  })

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const handleCsv = () => {
    if (!data) return
    const rows = [
      ['항목', '값'],
      ['클럽', data.club.name],
      ['집계 기간 시작', new Date(data.period.start).toLocaleDateString('ko-KR')],
      ['집계 기간 종료', new Date(data.period.end).toLocaleDateString('ko-KR')],
      ['주차 수', String(data.period.weeks)],
      ['', ''],
      ['[정량지표]', ''],
      ['운영 중인 프로젝트', String(data.counts.projects_total)],
      ['- 활성', String(data.counts.projects_active)],
      ['- 종료', String(data.counts.projects_closed)],
      ['참여 학생 수', String(data.counts.members_total)],
      ['- 운영진', String(data.counts.members_admin)],
      ['주간 업데이트 제출', String(data.counts.updates_submitted)],
      ['제출률(%)', String(data.counts.submission_rate_percent)],
      ['팀당 평균 구성원', String(data.counts.avg_team_size)],
      ['', ''],
      ['[정성지표]', ''],
      ['의사결정 기록', String(data.counts.decisions_total)],
      ['자료 공유', String(data.counts.resources_shared)],
      ['할일 완료 건수', String(data.counts.tasks_completed)],
      ['할일 완료율(%)', String(data.counts.task_completion_rate_percent ?? '-')],
      ['AI 봇 개입', String(data.counts.bot_interventions_total)],
      ['봇 수락률(%)', String(data.counts.bot_acceptance_rate_percent ?? '-')],
      ['Discord 메시지', String(data.counts.discord_messages_total)],
      ['활동 멤버 수', String(data.counts.active_contributors)],
      ['', ''],
      ['[기수별]', ''],
      ...data.cohorts.map(c => [c.name, `멤버 ${c.members} / 프로젝트 ${c.projects}`]),
      ['', ''],
      ['[직무별]', ''],
      ...data.positions.map(p => [POSITION_LABEL[p.name] ?? p.name, String(p.count)]),
      ['', ''],
      ['[프로젝트 단계]', ''],
      ['아이디어', String(data.stages.ideation)],
      ['설계', String(data.stages.design)],
      ['구현', String(data.stages.development)],
      ['런칭', String(data.stages.launch)],
      ['미착수', String(data.stages.not_started)],
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${clubName}_KPI_${PRESET_LABEL[preset]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-surface-bg min-h-full print:bg-white">
      <PageContainer size="wide" className="pt-6 pb-16">
        {/* 상단 네비 — 인쇄 시 숨김 */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link
            href={`/clubs/${slug}`}
            className="flex items-center gap-1.5 text-[13px] text-txt-tertiary hover:text-txt-primary transition-colors"
          >
            <ChevronLeft size={16} />
            {clubName}으로
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCsv}
              disabled={!data}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-txt-secondary border border-border rounded-full hover:border-txt-tertiary transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              CSV 다운로드
            </button>
            <button
              onClick={handlePrint}
              disabled={!data}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-semibold bg-brand text-white rounded-full hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              <Printer size={14} />
              PDF로 인쇄
            </button>
          </div>
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1 print:hidden">
            <BarChart3 size={16} className="text-brand" />
            <p className="text-[12px] font-semibold text-brand">성과 보고서</p>
          </div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-txt-primary tracking-tight print:text-[24px]">
            {clubName} KPI 보고서
          </h1>
          <p className="text-[14px] text-txt-secondary mt-1.5">
            창업지원단·LINC·RISE·캠퍼스타운 제출용 정량·정성 지표 자동 집계
          </p>
        </div>

        {/* 기간 프리셋 — 인쇄 시 숨김 */}
        <div className="flex gap-2 mb-6 overflow-x-auto print:hidden" style={{ scrollbarWidth: 'none' }}>
          {(Object.keys(PRESET_LABEL) as RangePreset[]).map(k => (
            <button
              key={k}
              onClick={() => setPreset(k)}
              className={`shrink-0 px-3.5 py-1.5 text-[13px] font-medium rounded-full border transition-colors ${
                preset === k
                  ? 'bg-surface-inverse text-txt-inverse border-surface-inverse'
                  : 'text-txt-secondary border-border bg-surface-card hover:border-txt-tertiary'
              }`}
            >
              {PRESET_LABEL[k]}
            </button>
          ))}
        </div>

        {isLoading || !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            {/* 집계 메타 */}
            <div className="bg-surface-card border border-border rounded-2xl p-5 mb-6 print:border print:border-black">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
                <div>
                  <p className="text-txt-tertiary">집계 기간</p>
                  <p className="font-semibold text-txt-primary mt-0.5">
                    {new Date(data.period.start).toLocaleDateString('ko-KR')}
                    {' ~ '}
                    {new Date(data.period.end).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-txt-tertiary">주차 수</p>
                  <p className="font-semibold text-txt-primary mt-0.5">{data.period.weeks}주</p>
                </div>
                <div>
                  <p className="text-txt-tertiary">생성일시</p>
                  <p className="font-semibold text-txt-primary mt-0.5">
                    {new Date(data.generated_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            {/* 정량지표 */}
            <h2 className="text-[16px] font-bold text-txt-primary mb-3 flex items-center gap-2">
              <Target size={16} className="text-brand" />
              정량지표
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              <KpiCard icon={<FolderOpen size={14} />} label="운영 프로젝트" value={data.counts.projects_total} hint={`활성 ${data.counts.projects_active} / 종료 ${data.counts.projects_closed}`} />
              <KpiCard icon={<Users size={14} />} label="참여 학생" value={data.counts.members_total} hint={`운영진 ${data.counts.members_admin}`} />
              <KpiCard icon={<CheckCircle2 size={14} />} label="주간 제출률" value={`${data.counts.submission_rate_percent}%`} hint={`제출 ${data.counts.updates_submitted}건`} tone={data.counts.submission_rate_percent >= 70 ? 'success' : 'neutral'} />
              <KpiCard icon={<Users size={14} />} label="팀당 평균" value={data.counts.avg_team_size} hint="명" />
            </div>

            {/* 정성지표 */}
            <h2 className="text-[16px] font-bold text-txt-primary mb-3 flex items-center gap-2">
              <Activity size={16} className="text-brand" />
              정성지표 (활동 증빙)
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              <KpiCard icon={<FileText size={14} />} label="의사결정 기록" value={data.counts.decisions_total} hint="Discord /마무리" />
              <KpiCard icon={<FileText size={14} />} label="공유 자료" value={data.counts.resources_shared} hint="링크·문서" />
              <KpiCard icon={<CheckCircle2 size={14} />} label="할일 완료" value={data.counts.tasks_completed} hint={data.counts.task_completion_rate_percent !== null ? `완료율 ${data.counts.task_completion_rate_percent}%` : '-'} />
              <KpiCard icon={<Sparkles size={14} />} label="AI 봇 수락률" value={data.counts.bot_acceptance_rate_percent !== null ? `${data.counts.bot_acceptance_rate_percent}%` : '—'} hint={`개입 ${data.counts.bot_interventions_total}건`} />
              <KpiCard icon={<MessageSquare size={14} />} label="Discord 메시지" value={data.counts.discord_messages_total.toLocaleString()} hint="기간 누적" />
              <KpiCard icon={<Users size={14} />} label="활동 멤버" value={data.counts.active_contributors} hint="메시지 기록 기준" />
            </div>

            {/* 시계열 차트 */}
            {data.timeseries && data.timeseries.length > 1 && (
              <div className="mb-8">
                <h2 className="text-[16px] font-bold text-txt-primary mb-3 flex items-center gap-2">
                  <Activity size={16} className="text-brand" />
                  주차별 활동 추이
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <KpiTimeseriesChart data={data.timeseries} metric="submissions" />
                  <KpiTimeseriesChart data={data.timeseries} metric="messages" />
                </div>
              </div>
            )}

            {/* 기수별 */}
            {data.cohorts.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[16px] font-bold text-txt-primary mb-3">기수별 분포</h2>
                <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-surface-sunken">
                      <tr>
                        <th className="text-left px-5 py-2.5 text-[12px] font-semibold text-txt-tertiary">기수</th>
                        <th className="text-right px-5 py-2.5 text-[12px] font-semibold text-txt-tertiary">멤버</th>
                        <th className="text-right px-5 py-2.5 text-[12px] font-semibold text-txt-tertiary">프로젝트</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.cohorts.map(c => (
                        <tr key={c.name} className="border-t border-border">
                          <td className="px-5 py-2.5 text-[13px] font-semibold text-txt-primary">{c.name}</td>
                          <td className="px-5 py-2.5 text-[13px] text-txt-secondary text-right tabular-nums">{c.members}</td>
                          <td className="px-5 py-2.5 text-[13px] text-txt-secondary text-right tabular-nums">{c.projects}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 직무별 */}
            {data.positions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[16px] font-bold text-txt-primary mb-3">직무 구성</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {data.positions.map(p => (
                    <div key={p.name} className="bg-surface-card border border-border rounded-xl p-4 text-center">
                      <div className="text-[20px] font-bold tabular-nums text-txt-primary">{p.count}</div>
                      <div className="text-[12px] text-txt-tertiary mt-0.5">{POSITION_LABEL[p.name] ?? p.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 프로젝트 단계 */}
            <div className="mb-8">
              <h2 className="text-[16px] font-bold text-txt-primary mb-3">프로젝트 단계 분포</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['ideation', 'design', 'development', 'launch', 'not_started'] as const).map(k => (
                  <div key={k} className="bg-surface-card border border-border rounded-xl p-4">
                    <div className="text-[12px] text-txt-tertiary">{STAGE_LABEL[k]}</div>
                    <div className="text-[22px] font-bold tabular-nums text-txt-primary mt-0.5">{data.stages[k]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 정부 프레이밍 가이드 — 인쇄 시 숨김 */}
            <div className="bg-brand-bg border border-brand-border rounded-2xl p-5 print:hidden">
              <div className="flex gap-3">
                <Sparkles size={16} className="text-brand shrink-0 mt-0.5" />
                <div className="text-[13px] text-txt-secondary leading-relaxed">
                  <p className="font-semibold text-txt-primary mb-1">이 보고서는 어디에 쓸까요</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>LINC 3.0 성과보고 · 창업동아리 운영지표</li>
                    <li>캠퍼스타운 연차평가 · 콘텐츠·디지털 재량예산 증빙</li>
                    <li>RISE 대학창업육성 · 정량·정성 성과 기록</li>
                    <li>창업지원단 반기·연간 결산 · 비교과 활동 증빙</li>
                  </ul>
                  <p className="mt-2 text-txt-tertiary">
                    별도 엑셀 집계 없이 Draft에 쌓인 활동 데이터를 그대로 보고서로 활용하세요
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  )
}

function KpiCard({ icon, label, value, hint, tone = 'neutral' }: {
  icon: React.ReactNode
  label: string
  value: number | string
  hint: string
  tone?: 'neutral' | 'success' | 'alert'
}) {
  const toneClass = tone === 'success' ? 'text-status-success-text' : tone === 'alert' ? 'text-status-danger-text' : 'text-txt-primary'
  return (
    <div className="bg-surface-card border border-border rounded-2xl p-5 print:border print:border-black print:rounded-none">
      <div className="flex items-center gap-1.5 text-txt-tertiary mb-2">
        {icon}
        <span className="text-[12px]">{label}</span>
      </div>
      <div className={`text-[24px] font-bold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-[11px] text-txt-disabled mt-1">{hint}</div>
    </div>
  )
}
