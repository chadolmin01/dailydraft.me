import Link from 'next/link'
import { getDb, ensureSchema } from '@/src/lib/db'

// 의도: 홈 = 가벼운 dashboard. DB 초기 상태 + 5 모듈 진입점.
export default async function HomePage() {
  await ensureSchema()
  const db = getDb()
  const [pRows, tRows, sRows] = await Promise.all([
    db.execute('select count(*) as n from programs'),
    db.execute('select count(*) as n from teams'),
    db.execute('select count(*) as n from submissions'),
  ])
  const counts = {
    programs: Number(pRows.rows[0]?.n ?? 0),
    teams: Number(tRows.rows[0]?.n ?? 0),
    submissions: Number(sRows.rows[0]?.n ?? 0),
  }

  const cards = [
    { href: '/programs', title: '프로그램 설계', desc: '기간, 마일스톤, 산출물 양식', count: `${counts.programs}개` },
    { href: '/teams', title: '팀 관리', desc: '팀과 멤버 등록', count: `${counts.teams}팀` },
    { href: '/collection', title: '주간 수집', desc: '폼 만들고 멤버에게 링크 발송', count: `${counts.submissions}건 제출` },
    { href: '/dashboard', title: '대시보드', desc: '진행도, 마감, 미제출 한눈에', count: '' },
    { href: '/reports', title: '보고서 생성', desc: '템플릿에 데이터 채워 PDF', count: '' },
  ]

  return (
    <div>
      <header className="mb-8">
        <p className="text-sm text-muted mb-2">로컬 데모 · 인증 없음</p>
        <h1 className="text-3xl font-bold mb-2">창업센터 운영 워크스페이스</h1>
        <p className="text-muted">매니저 수동 입력 중심. AI 보조는 별도.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card p-6 hover:border-primary transition">
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-semibold text-ink">{c.title}</h2>
              {c.count && <span className="text-xs text-muted">{c.count}</span>}
            </div>
            <p className="text-sm text-muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
