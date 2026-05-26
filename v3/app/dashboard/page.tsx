import Link from 'next/link'
import { all, asInt } from '@/src/lib/queries'
import { TeamProgressBar } from '@/src/components/Charts'

interface Program {
  id: number
  name: string
}

interface TeamProgress {
  team_id: number
  team_name: string
  program_name: string
  assigned: number
  submitted: number
}

interface UpcomingMilestone {
  id: number
  program_name: string
  week_no: number
  title: string
  due_date: string
  link_count: number
  submitted_count: number
}

interface MissingTeam {
  milestone_id: number
  milestone_title: string
  program_name: string
  week_no: number
  due_date: string | null
  team_id: number
  team_name: string
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const sp = await searchParams
  const programFilter = sp.program ? parseInt(sp.program, 10) : null

  const programs = await all<Program>('select id, name from programs order by created_at desc')
  const programWhere = programFilter ? 'where p.id = ?' : ''
  const args = programFilter ? [programFilter] : []

  // 1) 팀별 진행도 — assigned (총 마일스톤+폼 수) / submitted
  const teamProgress = await all<TeamProgress>(`
    select
      t.id as team_id, t.name as team_name, p.name as program_name,
      (select count(*) from milestones m where m.program_id = p.id and m.form_id is not null) as assigned,
      (select count(*) from submissions s where s.team_id = t.id) as submitted
    from teams t join programs p on p.id = t.program_id
    ${programWhere.replace('p.id', 'p.id')}
    order by p.name, t.name
  `, args)

  // 2) 마감 임박 마일스톤 (오늘 + 7일 이내)
  const upcoming = await all<UpcomingMilestone>(`
    select
      m.id, p.name as program_name, m.week_no, m.title, m.due_date,
      (select count(*) from submission_links sl where sl.milestone_id = m.id) as link_count,
      (select count(*) from submission_links sl where sl.milestone_id = m.id and sl.submitted_at is not null) as submitted_count
    from milestones m join programs p on p.id = m.program_id
    where m.due_date is not null
      and date(m.due_date) >= date('now')
      and date(m.due_date) <= date('now', '+7 days')
      ${programFilter ? 'and p.id = ?' : ''}
    order by m.due_date
  `, args)

  // 3) 미제출 팀 (활성 마일스톤 × 팀, link 있는데 submitted_at null)
  const missing = await all<MissingTeam>(`
    select
      sl.milestone_id, m.title as milestone_title, p.name as program_name, m.week_no, m.due_date,
      sl.team_id, t.name as team_name
    from submission_links sl
    join milestones m on m.id = sl.milestone_id
    join programs p on p.id = m.program_id
    join teams t on t.id = sl.team_id
    where sl.submitted_at is null
      ${programFilter ? 'and p.id = ?' : ''}
    order by m.due_date, m.week_no, t.name
    limit 20
  `, args)

  const chartData = teamProgress.map((t) => {
    const assigned = asInt(t.assigned)
    const submitted = asInt(t.submitted)
    const pct = assigned > 0 ? Math.round((submitted / assigned) * 100) : 0
    return { team: t.team_name, pct, submitted, assigned }
  })

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">대시보드</h1>
          <p className="text-sm text-muted">팀별 진행도 + 마감 임박 + 미제출 한눈에.</p>
        </div>
        {programs.length > 0 && (
          <form className="flex items-center gap-2">
            <select name="program" defaultValue={programFilter ?? ''} className="input text-sm">
              <option value="">전체 프로그램</option>
              {programs.map((p) => (
                <option key={asInt(p.id)} value={asInt(p.id)}>{p.name}</option>
              ))}
            </select>
            <button type="submit" className="btn-ghost text-sm">필터</button>
          </form>
        )}
      </header>

      {programs.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-muted mb-2">먼저 프로그램을 등록하세요.</p>
          <Link href="/programs" className="text-primary text-sm">프로그램으로 이동 →</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 팀별 진행도 차트 */}
          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">팀별 진행도</h2>
              <span className="text-xs text-muted">제출 수 / 폼 있는 마일스톤 수</span>
            </div>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted py-8 text-center">팀이 없습니다.</p>
            ) : (
              <TeamProgressBar data={chartData} />
            )}
          </section>

          {/* 2단 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 마감 임박 */}
            <section className="card p-5">
              <h2 className="font-semibold mb-3">마감 임박 (7일 이내)</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted">임박한 마감 없음.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {upcoming.map((m) => {
                    const total = asInt(m.link_count)
                    const submitted = asInt(m.submitted_count)
                    return (
                      <li key={asInt(m.id)} className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.title}</p>
                            <p className="text-xs text-muted-soft mt-0.5">
                              {m.program_name} · {asInt(m.week_no)}주차 · 마감 {m.due_date}
                            </p>
                          </div>
                          <span className="text-sm">
                            <span className={submitted === total && total > 0 ? 'text-green-700' : 'text-muted'}>
                              {submitted}/{total}
                            </span>
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {/* 미제출 */}
            <section className="card p-5">
              <h2 className="font-semibold mb-3">미제출 (상위 20)</h2>
              {missing.length === 0 ? (
                <p className="text-sm text-muted">모든 팀이 제출 완료.</p>
              ) : (
                <ul className="divide-y divide-hairline">
                  {missing.map((m, idx) => (
                    <li key={idx} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{m.team_name}</span>
                        <span className="text-muted-soft ml-2 text-xs">
                          {m.program_name} · {asInt(m.week_no)}주차 {m.milestone_title}
                        </span>
                      </div>
                      <span className="text-xs text-muted">{m.due_date ?? ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
