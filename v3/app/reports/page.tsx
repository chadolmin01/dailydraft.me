import Link from 'next/link'
import { all, asInt } from '@/src/lib/queries'
import { generateReport, deleteReport } from './actions'

interface Program {
  id: number
  name: string
}

interface ReportRow {
  id: number
  program_id: number
  program_name: string
  title: string
  generated_at: string
}

export default async function ReportsPage() {
  const programs = await all<Program>('select id, name from programs order by created_at desc')
  const reports = await all<ReportRow>(`
    select r.id, r.program_id, p.name as program_name, r.title, r.generated_at
    from reports r join programs p on p.id = r.program_id
    order by r.generated_at desc
  `)

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">보고서</h1>
        <p className="text-sm text-muted">프로그램 현황 스냅샷 생성. 생성 후엔 그 시점 데이터로 고정.</p>
      </header>

      {programs.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-muted mb-2">먼저 프로그램을 등록하세요.</p>
          <Link href="/programs" className="text-primary text-sm">프로그램으로 이동 →</Link>
        </div>
      ) : (
        <>
          <section className="card p-5 mb-8">
            <h2 className="font-semibold mb-3">새 보고서 생성</h2>
            <form action={generateReport} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">프로그램</label>
                <select name="program_id" required className="input">
                  {programs.map((p) => (
                    <option key={asInt(p.id)} value={asInt(p.id)}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="label">제목 (선택)</label>
                <input name="title" className="input" placeholder="비우면 자동 생성" />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button type="submit" className="btn-primary">생성</button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="font-semibold mb-3">보고서 목록 ({reports.length})</h2>
            {reports.length === 0 ? (
              <p className="text-sm text-muted">아직 생성된 보고서가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {reports.map((r) => (
                  <li key={asInt(r.id)} className="card p-4 flex items-center gap-4">
                    <Link href={`/reports/${asInt(r.id)}`} className="flex-1">
                      <p className="font-medium hover:text-primary">{r.title}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {r.program_name} · {new Date(r.generated_at).toLocaleString('ko-KR')}
                      </p>
                    </Link>
                    <DeleteReportForm id={asInt(r.id)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function DeleteReportForm({ id }: { id: number }) {
  const action = async () => {
    'use server'
    await deleteReport(id)
  }
  return (
    <form action={action}>
      <button type="submit" className="text-xs text-muted hover:text-red-600">삭제</button>
    </form>
  )
}
