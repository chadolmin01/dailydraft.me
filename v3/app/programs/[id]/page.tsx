import Link from 'next/link'
import { notFound } from 'next/navigation'
import { all, one, asInt } from '@/src/lib/queries'
import { addMilestone, deleteMilestone } from '../actions'

interface Program {
  id: number
  name: string
  total_weeks: number
  start_date: string | null
  end_date: string | null
}

interface Milestone {
  id: number
  program_id: number
  week_no: number
  title: string
  due_date: string | null
  form_id: number | null
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const programId = parseInt(id, 10)
  if (isNaN(programId)) notFound()

  const program = await one<Program>('select * from programs where id = ?', [programId])
  if (!program) notFound()

  const milestones = await all<Milestone>(
    'select * from milestones where program_id = ? order by week_no',
    [programId],
  )

  const addAction = async (formData: FormData) => {
    'use server'
    await addMilestone(programId, formData)
  }

  return (
    <div>
      <Link href="/programs" className="text-sm text-muted hover:text-ink">← 프로그램 목록</Link>
      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-bold mb-1">{program.name}</h1>
        <p className="text-sm text-muted">
          {program.start_date ?? '시작일 미정'} ~ {program.end_date ?? '종료일 미정'} · 총 {asInt(program.total_weeks)}주차
        </p>
      </header>

      <section className="card p-5 mb-8">
        <h2 className="font-semibold mb-3">새 마일스톤 (주차)</h2>
        <form action={addAction} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label">주차</label>
            <input name="week_no" type="number" min="1" max={asInt(program.total_weeks)} required className="input" placeholder="1" />
          </div>
          <div className="md:col-span-2">
            <label className="label">제목</label>
            <input name="title" required className="input" placeholder="예: 시장조사" />
          </div>
          <div>
            <label className="label">마감일</label>
            <input name="due_date" type="date" className="input" />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary">추가</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-3">마일스톤 ({milestones.length} / {asInt(program.total_weeks)})</h2>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted">아직 등록된 마일스톤이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {milestones.map((m) => (
              <li key={m.id} className="card p-4 flex items-center gap-4">
                <span className="text-xs text-muted-soft w-12">{asInt(m.week_no)}주차</span>
                <span className="flex-1 font-medium">{m.title}</span>
                <span className="text-sm text-muted">{m.due_date ?? '마감일 미정'}</span>
                <DeleteMilestoneForm id={asInt(m.id)} programId={programId} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function DeleteMilestoneForm({ id, programId }: { id: number; programId: number }) {
  const action = async () => {
    'use server'
    await deleteMilestone(id, programId)
  }
  return (
    <form action={action}>
      <button type="submit" className="text-xs text-muted hover:text-red-600">삭제</button>
    </form>
  )
}
