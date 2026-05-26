import { all, asInt } from '@/src/lib/queries'
import { parseFields } from '@/src/lib/forms'
import { FormBuilder } from './FormBuilder'
import { createFormAndLinks, markLinksSent } from './actions'

interface Program {
  id: number
  name: string
}

interface MilestoneRow {
  id: number
  program_id: number
  program_name: string
  week_no: number
  title: string
  due_date: string | null
  form_id: number | null
  form_name: string | null
  fields_json: string | null
  link_count: number
  sent_count: number
  submitted_count: number
}

interface LinkRow {
  id: number
  milestone_id: number
  team_id: number
  team_name: string
  token: string
  sent_at: string | null
  submitted_at: string | null
}

export default async function CollectionPage({ searchParams }: { searchParams: Promise<{ milestone?: string }> }) {
  const sp = await searchParams
  const selectedId = sp.milestone ? parseInt(sp.milestone, 10) : null

  const programs = await all<Program>('select id, name from programs order by created_at desc')
  const milestones = await all<MilestoneRow>(`
    select
      m.id, m.program_id, p.name as program_name, m.week_no, m.title, m.due_date, m.form_id,
      f.name as form_name, f.fields_json,
      (select count(*) from submission_links sl where sl.milestone_id = m.id) as link_count,
      (select count(*) from submission_links sl where sl.milestone_id = m.id and sl.sent_at is not null) as sent_count,
      (select count(*) from submission_links sl where sl.milestone_id = m.id and sl.submitted_at is not null) as submitted_count
    from milestones m
    join programs p on p.id = m.program_id
    left join forms f on f.id = m.form_id
    order by p.name, m.week_no
  `)

  const selected = selectedId ? milestones.find((m) => asInt(m.id) === selectedId) : null
  const links = selected
    ? await all<LinkRow>(`
        select sl.id, sl.milestone_id, sl.team_id, t.name as team_name, sl.token, sl.sent_at, sl.submitted_at
        from submission_links sl join teams t on t.id = sl.team_id
        where sl.milestone_id = ? order by t.name
      `, [selectedId])
    : []

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">주간 수집</h1>
        <p className="text-sm text-muted">마일스톤에 폼 만들고, 자동 생성된 팀별 링크를 멤버에게 전달.</p>
      </header>

      {milestones.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-muted mb-2">먼저 프로그램과 마일스톤을 만드세요.</p>
          <a href="/programs" className="text-primary text-sm">프로그램으로 이동 →</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 마일스톤 목록 */}
          <aside className="lg:col-span-1">
            <h2 className="font-semibold mb-3 text-sm text-muted">마일스톤</h2>
            <ul className="space-y-1">
              {milestones.map((m) => {
                const mid = asInt(m.id)
                const isActive = mid === selectedId
                return (
                  <li key={mid}>
                    <a
                      href={`/collection?milestone=${mid}`}
                      className={`block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-primary text-white' : 'hover:bg-surface text-ink'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{m.program_name} · {asInt(m.week_no)}주차</span>
                        {m.form_id && <span className={`text-xs ${isActive ? 'text-white/80' : 'text-muted'}`}>{asInt(m.submitted_count)}/{asInt(m.link_count)}</span>}
                      </div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-white/80' : 'text-muted-soft'}`}>{m.title}</div>
                    </a>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* 우측: 선택된 마일스톤 상세 */}
          <section className="lg:col-span-2">
            {selected ? (
              <div className="space-y-6">
                <div className="card p-5">
                  <p className="text-xs text-muted">{selected.program_name} · {asInt(selected.week_no)}주차 · 마감 {selected.due_date ?? '미정'}</p>
                  <h2 className="text-xl font-semibold mt-1">{selected.title}</h2>
                </div>

                {selected.form_id ? (
                  <ExistingForm
                    milestoneId={asInt(selected.id)}
                    formName={selected.form_name ?? ''}
                    fields={parseFields(selected.fields_json ?? '[]')}
                    links={links}
                  />
                ) : (
                  <NewFormSection
                    programId={asInt(selected.program_id)}
                    milestoneId={asInt(selected.id)}
                  />
                )}
              </div>
            ) : (
              <div className="card p-8 text-center text-muted">
                좌측에서 마일스톤을 선택하세요.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function NewFormSection({ programId, milestoneId }: { programId: number; milestoneId: number }) {
  const action = async (formData: FormData) => {
    'use server'
    await createFormAndLinks(programId, milestoneId, formData)
  }
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">새 폼 만들기</h3>
      <form action={action} className="space-y-4">
        <div>
          <label className="label">폼 이름</label>
          <input name="name" required className="input" placeholder="예: 2주차 진척 보고서" />
        </div>
        <FormBuilder />
        <div className="flex justify-end">
          <button type="submit" className="btn-primary">폼 생성 + 팀 링크 자동 생성</button>
        </div>
      </form>
    </div>
  )
}

function ExistingForm({
  milestoneId, formName, fields, links,
}: { milestoneId: number; formName: string; fields: ReturnType<typeof parseFields>; links: LinkRow[] }) {
  const sentAction = async () => {
    'use server'
    await markLinksSent(milestoneId)
  }
  return (
    <>
      <div className="card p-5">
        <h3 className="font-semibold mb-2">{formName}</h3>
        <p className="text-xs text-muted mb-3">필드 {fields.length}개</p>
        <ul className="text-sm space-y-1">
          {fields.map((f) => (
            <li key={f.key} className="flex items-center gap-2">
              <span className="text-muted-soft text-xs w-16">{f.type}</span>
              <span>{f.label}</span>
              {f.required && <span className="text-xs text-red-600">필수</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">팀별 링크</h3>
          <form action={sentAction}>
            <button type="submit" className="btn-ghost text-xs">미발송 모두 발송 처리</button>
          </form>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs text-muted">
            <tr><th className="text-left py-2">팀</th><th className="text-left py-2">링크</th><th className="text-left py-2">발송</th><th className="text-left py-2">제출</th></tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {links.map((l) => (
              <tr key={asInt(l.id)}>
                <td className="py-2 font-medium">{l.team_name}</td>
                <td className="py-2">
                  <a href={`/m/${l.token}`} target="_blank" className="text-primary text-xs underline">/m/{l.token.slice(0, 8)}…</a>
                </td>
                <td className="py-2 text-xs text-muted">{l.sent_at ? '발송됨' : '미발송'}</td>
                <td className="py-2 text-xs">{l.submitted_at ? <span className="text-green-700">완료</span> : <span className="text-muted">대기</span>}</td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-muted">팀이 없습니다. /teams 에서 추가하세요.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
