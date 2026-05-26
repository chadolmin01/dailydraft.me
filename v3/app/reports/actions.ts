'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { run, all, one, asInt } from '@/src/lib/queries'

interface Program {
  id: number
  name: string
}

interface TeamRow {
  id: number
  name: string
  total_milestones_with_form: number
  submitted: number
}

interface MilestoneRow {
  id: number
  week_no: number
  title: string
  due_date: string | null
  submitted: number
  total_teams: number
}

interface MissingRow {
  team_name: string
  week_no: number
  milestone_title: string
}

// 의도: "현재 상태 스냅샷" 을 data_json 으로 저장.
//       추후 동일 보고서 다시 보면 그때 스냅샷 그대로 (이후 데이터 변경 무관).
//       매니저가 "이번 주 사업단장 보고서" 클릭 → 즉시 생성 + 상세 페이지 이동.
export async function generateReport(formData: FormData): Promise<void> {
  const programId = asInt(formData.get('program_id'))
  const title = String(formData.get('title') ?? '').trim() ||
    `주간 운영 보고 ${new Date().toLocaleDateString('ko-KR')}`
  if (!programId) throw new Error('프로그램을 선택하세요')

  const program = await one<Program>('select id, name from programs where id = ?', [programId])
  if (!program) throw new Error('프로그램을 찾을 수 없음')

  // 팀별 진행도
  const teams = await all<TeamRow>(`
    select
      t.id, t.name,
      (select count(*) from milestones m where m.program_id = ? and m.form_id is not null) as total_milestones_with_form,
      (select count(*) from submissions s where s.team_id = t.id) as submitted
    from teams t where t.program_id = ?
    order by t.name
  `, [programId, programId])

  // 마일스톤 + 제출 현황
  const milestones = await all<MilestoneRow>(`
    select
      m.id, m.week_no, m.title, m.due_date,
      (select count(*) from submission_links sl where sl.milestone_id = m.id and sl.submitted_at is not null) as submitted,
      (select count(*) from submission_links sl where sl.milestone_id = m.id) as total_teams
    from milestones m where m.program_id = ?
    order by m.week_no
  `, [programId])

  // 최근 미제출 (top 10)
  const missing = await all<MissingRow>(`
    select t.name as team_name, m.week_no, m.title as milestone_title
    from submission_links sl
    join milestones m on m.id = sl.milestone_id
    join teams t on t.id = sl.team_id
    where sl.submitted_at is null and m.program_id = ?
    order by m.week_no, t.name
    limit 10
  `, [programId])

  const snapshot = {
    program_name: program.name,
    generated_at: new Date().toISOString(),
    teams: teams.map((t) => ({
      name: t.name,
      submitted: asInt(t.submitted),
      total: asInt(t.total_milestones_with_form),
    })),
    milestones: milestones.map((m) => ({
      week_no: asInt(m.week_no),
      title: m.title,
      due_date: m.due_date,
      submitted: asInt(m.submitted),
      total_teams: asInt(m.total_teams),
    })),
    missing: missing.map((m) => ({
      team_name: m.team_name,
      week_no: asInt(m.week_no),
      milestone_title: m.milestone_title,
    })),
    summary: {
      team_count: teams.length,
      milestone_count: milestones.length,
      total_submissions: teams.reduce((s, t) => s + asInt(t.submitted), 0),
    },
  }

  const res = await run(
    'insert into reports (program_id, title, data_json) values (?, ?, ?)',
    [programId, title, JSON.stringify(snapshot)],
  )
  const reportId = res.lastInsertRowid ? Number(res.lastInsertRowid) : 0

  revalidatePath('/reports')
  revalidatePath('/')
  redirect(`/reports/${reportId}`)
}

export async function deleteReport(id: number) {
  await run('delete from reports where id = ?', [id])
  revalidatePath('/reports')
}
