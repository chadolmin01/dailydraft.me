import { createClient as createAnonClient } from '@supabase/supabase-js'
import { APP_URL } from '@/src/constants'

export const runtime = 'nodejs'
export const revalidate = 300 // 5분 edge cache

/**
 * GET /status/feed.xml
 *
 * Atom 1.0 피드 — 공개 인시던트를 RSS 리더·모니터링 시스템이 구독할 수 있게.
 *
 * 스코프: 최근 90일 인시던트 (status_incidents). SEV-0·SEV-1 우선.
 * 업데이트: 5분 edge cache + SWR.
 *
 * 엔터프라이즈 고객이 자체 상태 모니터링 대시보드에 Draft 인시던트 자동 수집하는 용도.
 */

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

interface IncidentRow {
  id: string
  title: string
  severity: 'sev0' | 'sev1' | 'sev2' | 'sev3'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  started_at: string
  resolved_at: string | null
  affected_components: string[] | null
  summary: string
  updated_at?: string
}

const STATUS_LABEL: Record<IncidentRow['status'], string> = {
  investigating: '조사 중',
  identified: '원인 파악',
  monitoring: '모니터링',
  resolved: '해결됨',
}

export async function GET() {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('status_incidents')
    .select('id, title, severity, status, started_at, resolved_at, affected_components, summary, updated_at')
    .gte('started_at', ninetyDaysAgo)
    .order('started_at', { ascending: false })
    .limit(50)

  const incidents = (data ?? []) as IncidentRow[]
  const now = new Date().toISOString()
  const feedUpdated = incidents[0]?.updated_at ?? incidents[0]?.resolved_at ?? incidents[0]?.started_at ?? now

  const entries = incidents
    .map((i) => {
      const updated = i.updated_at ?? i.resolved_at ?? i.started_at
      const affected =
        i.affected_components && i.affected_components.length > 0
          ? ` · 영향: ${i.affected_components.join(', ')}`
          : ''
      const resolvedLine = i.resolved_at
        ? `<br/>해결: ${new Date(i.resolved_at).toLocaleString('ko-KR')}`
        : ''
      return `  <entry>
    <id>${APP_URL}/status#incident-${escape(i.id)}</id>
    <title>[${i.severity.toUpperCase()}] ${escape(i.title)}</title>
    <link rel="alternate" type="text/html" href="${APP_URL}/status" />
    <updated>${updated}</updated>
    <published>${i.started_at}</published>
    <summary type="html">${escape(
      i.summary,
    )} (${STATUS_LABEL[i.status]}${affected}${resolvedLine})</summary>
    <category term="${i.severity}" />
    <category term="${i.status}" />
  </entry>`
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Draft · 공개 인시던트 피드</title>
  <subtitle>최근 90일 SEV-0~SEV-3 인시던트 이력. 5분마다 갱신.</subtitle>
  <link rel="alternate" type="text/html" href="${APP_URL}/status" />
  <link rel="self" type="application/atom+xml" href="${APP_URL}/status/feed.xml" />
  <id>${APP_URL}/status/feed.xml</id>
  <updated>${feedUpdated}</updated>
  <author>
    <name>Draft</name>
    <email>team@dailydraft.me</email>
  </author>
  <generator uri="${APP_URL}" version="1.0">Draft Status</generator>
${entries}
</feed>
`
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
    },
  })
}
