import { ROADMAP, type RoadmapItem } from '@/src/content/roadmap'
import { APP_URL } from '@/src/constants'

export const runtime = 'nodejs'
export const revalidate = 3600

/**
 * GET /roadmap/feed.xml — Atom 1.0.
 *
 * 로드맵도 RSS 로 구독 가능. Changelog 와 대칭 (변경 추적 vs 계획 추적).
 * 각 분기를 하나의 entry 로 집계 — shipped 된 항목은 changelog feed 와 이중 노출 정상.
 */
export async function GET() {
  const updated = new Date().toISOString()

  const entries = ROADMAP.map((q) => {
    const id = `${APP_URL}/roadmap#${encodeURIComponent(q.quarter.replace(/\s+/g, '-'))}`
    const contentHtml = `
      <p><em>${escapeXml(q.theme)}</em></p>
      <ul>${q.items.map(itemLine).join('')}</ul>
    `.trim()
    return `<entry>
      <title>${escapeXml(`${q.quarter} · ${q.theme}`)}</title>
      <id>${escapeXml(id)}</id>
      <link href="${escapeXml(`${APP_URL}/roadmap`)}"/>
      <published>${isoForQuarter(q.quarter)}</published>
      <updated>${updated}</updated>
      <content type="html"><![CDATA[${contentHtml}]]></content>
    </entry>`
  })

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Draft — 로드맵</title>
  <subtitle>분기별 로드맵과 기능 계획</subtitle>
  <link href="${APP_URL}/roadmap"/>
  <link rel="self" href="${APP_URL}/roadmap/feed.xml"/>
  <id>${APP_URL}/roadmap</id>
  <updated>${updated}</updated>
  <author><name>Draft Team</name><email>team@dailydraft.me</email></author>
  ${entries.join('\n  ')}
</feed>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

function itemLine(i: RoadmapItem): string {
  const tag =
    i.status === 'shipped' ? '✅' :
    i.status === 'in-progress' ? '🛠️' :
    i.status === 'deferred' ? '⏸️' : '📌'
  return `<li>${tag} <strong>${escapeXml(i.title)}</strong>${i.note ? ` — ${escapeXml(i.note)}` : ''}</li>`
}

function isoForQuarter(q: string): string {
  // "Q2 2026" → 2026-04-01
  const m = q.match(/Q(\d)\s+(\d{4})/)
  if (!m) return new Date().toISOString()
  const [, n, year] = m
  const month = (parseInt(n) - 1) * 3 + 1
  return new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00+09:00`).toISOString()
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
