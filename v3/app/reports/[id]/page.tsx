import { notFound } from 'next/navigation'
import Link from 'next/link'
import { one, asInt } from '@/src/lib/queries'
import { PrintButton } from './PrintButton'

interface ReportRow {
  id: number
  program_id: number
  title: string
  generated_at: string
  data_json: string
}

interface ReportData {
  program_name: string
  generated_at: string
  teams: Array<{ name: string; submitted: number; total: number }>
  milestones: Array<{ week_no: number; title: string; due_date: string | null; submitted: number; total_teams: number }>
  missing: Array<{ team_name: string; week_no: number; milestone_title: string }>
  summary: { team_count: number; milestone_count: number; total_submissions: number }
}

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const reportId = parseInt(id, 10)
  if (isNaN(reportId)) notFound()

  const report = await one<ReportRow>('select * from reports where id = ?', [reportId])
  if (!report) notFound()

  let data: ReportData
  try {
    data = JSON.parse(report.data_json) as ReportData
  } catch {
    notFound()
  }

  const totalAssigned = data.teams.reduce((s, t) => s + t.total, 0)
  const totalSubmitted = data.teams.reduce((s, t) => s + t.submitted, 0)
  const overallPct = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto print:max-w-full">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/reports" className="text-sm text-muted hover:text-ink">← 보고서 목록</Link>
        <PrintButton />
      </div>

      <article className="card p-8 print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-hairline pb-4 mb-6">
          <p className="text-xs text-muted">{data.program_name}</p>
          <h1 className="text-2xl font-bold mt-1">{report.title}</h1>
          <p className="text-xs text-muted mt-2">
            생성: {new Date(data.generated_at).toLocaleString('ko-KR')}
          </p>
        </header>

        {/* 요약 */}
        <section className="grid grid-cols-3 gap-4 mb-8">
          <SummaryCard label="전체 제출률" value={`${overallPct}%`} sub={`${totalSubmitted}/${totalAssigned}건`} />
          <SummaryCard label="참여 팀" value={`${data.summary.team_count}팀`} />
          <SummaryCard label="마일스톤" value={`${data.summary.milestone_count}건`} />
        </section>

        {/* 팀별 진행도 */}
        <section className="mb-8">
          <h2 className="font-semibold mb-3">팀별 진행도</h2>
          {data.teams.length === 0 ? (
            <p className="text-sm text-muted">등록된 팀이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-hairline">
                  <th className="text-left py-2">팀</th>
                  <th className="text-right py-2">제출</th>
                  <th className="text-right py-2">총</th>
                  <th className="text-right py-2">진행률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {data.teams.map((t) => {
                  const pct = t.total > 0 ? Math.round((t.submitted / t.total) * 100) : 0
                  return (
                    <tr key={t.name}>
                      <td className="py-2 font-medium">{t.name}</td>
                      <td className="py-2 text-right">{t.submitted}</td>
                      <td className="py-2 text-right">{t.total}</td>
                      <td className="py-2 text-right">
                        <span className={pct >= 80 ? 'text-green-700' : pct >= 40 ? 'text-blue-700' : 'text-red-600'}>
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* 마일스톤 현황 */}
        <section className="mb-8">
          <h2 className="font-semibold mb-3">마일스톤 현황</h2>
          {data.milestones.length === 0 ? (
            <p className="text-sm text-muted">등록된 마일스톤이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-hairline">
                  <th className="text-left py-2 w-16">주차</th>
                  <th className="text-left py-2">제목</th>
                  <th className="text-left py-2 w-28">마감</th>
                  <th className="text-right py-2 w-20">제출</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {data.milestones.map((m) => (
                  <tr key={m.week_no}>
                    <td className="py-2 text-muted-soft">{m.week_no}주차</td>
                    <td className="py-2">{m.title}</td>
                    <td className="py-2 text-xs">{m.due_date ?? '미정'}</td>
                    <td className="py-2 text-right">
                      {m.total_teams > 0 ? `${m.submitted}/${m.total_teams}` : '폼 없음'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 미제출 */}
        {data.missing.length > 0 && (
          <section className="mb-8">
            <h2 className="font-semibold mb-3">미제출 ({data.missing.length}건)</h2>
            <ul className="text-sm space-y-1">
              {data.missing.map((m, idx) => (
                <li key={idx} className="text-muted">
                  • {m.team_name} — {m.week_no}주차 {m.milestone_title}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="text-xs text-muted-soft pt-4 border-t border-hairline">
          본 보고서는 {new Date(data.generated_at).toLocaleString('ko-KR')} 시점의 스냅샷입니다.
        </footer>
      </article>
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-hairline rounded-xl p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-soft mt-0.5">{sub}</p>}
    </div>
  )
}
