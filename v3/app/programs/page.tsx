import Link from 'next/link'
import { all, asInt } from '@/src/lib/queries'
import { createProgram, deleteProgram } from './actions'

interface Program {
  id: number
  name: string
  total_weeks: number
  start_date: string | null
  end_date: string | null
  created_at: string
}

export default async function ProgramsPage() {
  const programs = await all<Program>('select * from programs order by created_at desc')

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">프로그램</h1>
        <p className="text-sm text-muted">창업 프로그램 정의 (기간 + 주차 수). 마일스톤은 각 프로그램 안에서 등록.</p>
      </header>

      <section className="card p-5 mb-8">
        <h2 className="font-semibold mb-3">새 프로그램</h2>
        <form action={createProgram} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="label">이름</label>
            <input name="name" className="input" required placeholder="예: FLIP 1기" />
          </div>
          <div>
            <label className="label">총 주차</label>
            <input name="total_weeks" type="number" min="1" max="52" defaultValue={12} className="input" />
          </div>
          <div>
            <label className="label">시작일</label>
            <input name="start_date" type="date" className="input" />
          </div>
          <div>
            <label className="label">종료일</label>
            <input name="end_date" type="date" className="input" />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary">등록</button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-3">목록 ({programs.length})</h2>
        {programs.length === 0 ? (
          <p className="text-sm text-muted">아직 등록된 프로그램이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {programs.map((p) => (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between mb-2">
                  <Link href={`/programs/${p.id}`} className="font-semibold text-ink hover:text-primary">
                    {p.name}
                  </Link>
                  <DeleteForm id={asInt(p.id)} />
                </div>
                <p className="text-sm text-muted">
                  {p.start_date ?? '시작일 미정'} ~ {p.end_date ?? '종료일 미정'} · 총 {asInt(p.total_weeks)}주차
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function DeleteForm({ id }: { id: number }) {
  const deleteAction = async () => {
    'use server'
    await deleteProgram(id)
  }
  return (
    <form action={deleteAction}>
      <button type="submit" className="text-xs text-muted hover:text-red-600">삭제</button>
    </form>
  )
}
