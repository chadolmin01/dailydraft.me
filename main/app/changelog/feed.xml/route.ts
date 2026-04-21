import { CHANGELOG, type ChangelogEntry, type ChangelogEntryType } from '@/src/content/changelog'
import { APP_URL } from '@/src/constants'

export const runtime = 'nodejs'
export const revalidate = 3600 // 1시간

/**
 * GET /changelog/feed.xml — Atom 1.0 피드.
 *
 * 엔터프라이즈 파트너·기관·RSS 구독자가 Draft 릴리스를 자동 추적 가능.
 * changelog.ts 가 단일 진실 소스이므로 이 라우트도 같은 데이터 사용.
 *
 * feedly / inoreader / slack rss bot 등 어디서든 바로 구독 가능.
 */
export async function GET() {
  const updated = new Date(CHANGELOG[0]?.date ?? Date.now()).toISOString()

  const entries = CHANGELOG.slice(0, 30).map((entry) => entryToXml(entry))

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Draft — 릴리스 노트</title>
  <subtitle>Draft 의 주요 배포·보안·기능 변경 이력</subtitle>
  <link href="${APP_URL}/changelog"/>
  <link rel="self" href="${APP_URL}/changelog/feed.xml"/>
  <id>${APP_URL}/changelog</id>
  <updated>${updated}</updated>
  <author>
    <name>Draft Team</name>
    <email>team@dailydraft.me</email>
  </author>
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

function entryToXml(entry: ChangelogEntry): string {
  const published = new Date(entry.date + 'T00:00:00+09:00').toISOString()
  const id = `${APP_URL}/changelog#${entry.date}`

  const title = `${entry.date}${entry.version ? ` · ${entry.version}` : ''}`

  // HTML content — /changelog 스타일 유지
  const contentHtml = `<ul>${entry.items
    .map(
      (i) =>
        `<li><strong>[${LABEL[i.type]}]</strong> ${escapeXml(i.title)}${
          i.note ? ` — ${escapeXml(i.note)}` : ''
        }</li>`,
    )
    .join('')}</ul>`

  return `<entry>
    <title>${escapeXml(title)}</title>
    <id>${escapeXml(id)}</id>
    <link href="${escapeXml(`${APP_URL}/changelog#${entry.date}`)}"/>
    <published>${published}</published>
    <updated>${published}</updated>
    <content type="html"><![CDATA[${contentHtml}]]></content>
  </entry>`
}

const LABEL: Record<ChangelogEntryType, string> = {
  feature: '신규',
  improvement: '개선',
  security: '보안',
  fix: '수정',
  docs: '문서',
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
