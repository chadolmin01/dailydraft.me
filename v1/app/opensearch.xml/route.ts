import { APP_URL } from '@/src/constants'

export const runtime = 'nodejs'
export const revalidate = 86400 // 1일

/**
 * /opensearch.xml — OpenSearch Description Document.
 *
 * 브라우저(Chrome·Edge·Firefox) 의 검색엔진 목록에 Draft 를 추가해
 * 주소창에서 직접 Draft 콘텐츠를 검색할 수 있게 한다.
 *
 * 결과 URL: https://dailydraft.me/explore?q={searchTerms}
 *
 * layout.tsx 의 `<link rel="search" type="application/opensearchdescription+xml" .../>`
 * 로 연결.
 */
export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>Draft</ShortName>
  <LongName>Draft — 동아리 운영 인프라</LongName>
  <Description>Draft 에서 공개된 클럽·프로젝트·프로필을 검색합니다.</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image height="32" width="32" type="image/x-icon">${APP_URL}/favicon.ico</Image>
  <Url type="text/html" method="get" template="${APP_URL}/explore?q={searchTerms}" />
  <Url type="application/opensearchdescription+xml" rel="self" template="${APP_URL}/opensearch.xml" />
  <moz:SearchForm xmlns:moz="http://www.mozilla.org/2006/browser/search/">${APP_URL}/explore</moz:SearchForm>
</OpenSearchDescription>
`
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/opensearchdescription+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
