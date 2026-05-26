import { all, asInt } from '@/src/lib/queries'
import { createTeam, deleteTeam, addMember, deleteMember } from './actions'

interface Program {
  id: number
  name: string
}

interface TeamWithCounts {
  id: number
  program_id: number
  program_name: string
  name: string
  member_count: number
  created_at: string
}

interface Member {
  id: number
  team_id: number
  name: string
  email: string | null
  phone: string | null
  role: string | null
}

export default async function TeamsPage() {
  const programs = await all<Program>('select id, name from programs order by created_at desc')
  const teams = await all<TeamWithCounts>(`
    select t.id, t.program_id, p.name as program_name, t.name, t.created_at,
      (select count(*) from team_members tm where tm.team_id = t.id) as member_count
    from teams t join programs p on p.id = t.program_id
    order by p.name, t.name
  `)
  const members = await all<Member>('select * from team_members order by team_id, name')

  const membersByTeam = new Map<number, Member[]>()
  for (const m of members) {
    const tid = asInt(m.team_id)
    if (!membersByTeam.has(tid)) membersByTeam.set(tid, [])
    membersByTeam.get(tid)!.push(m)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">팀</h1>
        <p className="text-sm text-muted">프로그램에 소속된 팀과 멤버 관리.</p>
      </header>

      {programs.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-muted mb-2">먼저 프로그램을 등록하세요.</p>
          <a href="/programs" className="text-primary text-sm">프로그램으로 이동 →</a>
        </div>
      ) : (
        <>
          <section className="card p-5 mb-8">
            <h2 className="font-semibold mb-3">새 팀</h2>
            <form action={createTeam} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">프로그램</label>
                <select name="program_id" required className="input">
                  {programs.map((p) => (
                    <option key={asInt(p.id)} value={asInt(p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">팀 이름</label>
                <input name="name" required className="input" placeholder="예: 3팀" />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button type="submit" className="btn-primary">등록</button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="font-semibold mb-3">목록 ({teams.length}팀)</h2>
            {teams.length === 0 ? (
              <p className="text-sm text-muted">아직 등록된 팀이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {teams.map((t) => {
                  const tid = asInt(t.id)
                  const teamMembers = membersByTeam.get(tid) ?? []
                  return (
                    <div key={tid} className="card p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-soft">{t.program_name}</span>
                            <h3 className="font-semibold">{t.name}</h3>
                          </div>
                          <p className="text-xs text-muted mt-0.5">멤버 {asInt(t.member_count)}명</p>
                        </div>
                        <DeleteTeamForm id={tid} />
                      </div>

                      <AddMemberForm teamId={tid} />

                      {teamMembers.length > 0 && (
                        <ul className="mt-3 divide-y divide-hairline">
                          {teamMembers.map((m) => (
                            <li key={asInt(m.id)} className="py-2 flex items-center gap-3">
                              <span className="font-medium">{m.name}</span>
                              {m.role && <span className="text-xs text-muted-soft">{m.role}</span>}
                              <span className="text-xs text-muted ml-auto">
                                {m.email ?? ''} {m.phone ?? ''}
                              </span>
                              <DeleteMemberForm id={asInt(m.id)} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function DeleteTeamForm({ id }: { id: number }) {
  const action = async () => {
    'use server'
    await deleteTeam(id)
  }
  return (
    <form action={action}>
      <button type="submit" className="text-xs text-muted hover:text-red-600">팀 삭제</button>
    </form>
  )
}

function AddMemberForm({ teamId }: { teamId: number }) {
  const action = async (formData: FormData) => {
    'use server'
    await addMember(teamId, formData)
  }
  return (
    <form action={action} className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
      <input name="name" required className="input" placeholder="이름 *" />
      <input name="role" className="input" placeholder="역할 (팀장 등)" />
      <input name="email" type="email" className="input" placeholder="이메일" />
      <input name="phone" className="input" placeholder="전화번호" />
      <button type="submit" className="btn-primary">멤버 추가</button>
    </form>
  )
}

function DeleteMemberForm({ id }: { id: number }) {
  const action = async () => {
    'use server'
    await deleteMember(id)
  }
  return (
    <form action={action}>
      <button type="submit" className="text-xs text-muted-soft hover:text-red-600">삭제</button>
    </form>
  )
}
