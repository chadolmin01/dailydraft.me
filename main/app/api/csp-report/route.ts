import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/csp-report
 *
 * Browser-native CSP violation receiver (Report-Only or enforcing mode).
 *
 * 브라우저가 Content-Security-Policy 위반을 감지하면 여기로 JSON POST.
 * 양식:
 *   - W3C CSP Level 2: { "csp-report": { ... } } (application/csp-report)
 *   - W3C Reporting API (Level 3): [{ "type": "csp-violation", "body": {...} }] (application/reports+json)
 *
 * 처리:
 *   - PostHog 에 `csp_violation` 이벤트로 기록 → 기존 관측 파이프라인 재사용
 *   - 개별 유저 식별 없음 (세션 토큰 수집 안 함)
 *
 * 보안:
 *   - 응답은 항상 204 (브라우저가 재시도 안 하도록)
 *   - CSRF 면제 경로 (브라우저가 자동 발송, origin 은 사내)
 *   - body 크기 제한 10KB
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''
  let payload: unknown = null

  try {
    const text = await request.text()
    if (text.length > 10_000) {
      return new Response(null, { status: 413 })
    }
    payload = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }

  // 2가지 포맷 양쪽에서 body 만 추출
  let body: Record<string, unknown> | null = null
  if (Array.isArray(payload)) {
    const first = payload[0] as { body?: Record<string, unknown> } | undefined
    body = first?.body ?? null
  } else if (payload && typeof payload === 'object') {
    const p = payload as { 'csp-report'?: Record<string, unknown>; body?: Record<string, unknown> }
    body = p['csp-report'] ?? p.body ?? null
  }

  if (!body) {
    return new Response(null, { status: 400 })
  }

  // PostHog server-side ingest — 키 없으면 조용히 스킵
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  if (posthogKey) {
    // fire-and-forget
    fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: posthogKey,
        event: 'csp_violation',
        distinct_id: 'csp-reporter',
        properties: {
          content_type: contentType,
          blocked_uri: body['blocked-uri'] ?? body.blockedURL ?? null,
          violated_directive: body['violated-directive'] ?? body.effectiveDirective ?? null,
          document_uri: body['document-uri'] ?? body.documentURL ?? null,
          source_file: body['source-file'] ?? body.sourceFile ?? null,
          line_number: body['line-number'] ?? body.lineNumber ?? null,
          referrer: body.referrer ?? null,
          status_code: body['status-code'] ?? null,
          disposition: body.disposition ?? 'enforce',
        },
      }),
    }).catch(() => {
      // ignore — 관측 실패는 서비스 차단 이유가 아님
    })
  }

  return new Response(null, { status: 204 })
}

export async function GET() {
  return new Response('Method not allowed', { status: 405 })
}
