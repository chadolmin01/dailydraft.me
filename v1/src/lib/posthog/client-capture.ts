'use client'

import posthog from 'posthog-js'

/**
 * 브라우저에서 발생한 에러를 PostHog + 서버 DB(`/api/client-error-log`) 양쪽으로 전송.
 *
 * - `logError()`는 서버 전용 supabase-admin 클라이언트를 쓰므로 브라우저에서 직접 호출 불가.
 *   → 서버 라우트 경유.
 * - 네트워크 실패는 조용히 무시 (사용자 UX 영향 금지).
 */
export function captureClientError(
  error: Error,
  context?: { source?: string; digest?: string; extra?: Record<string, unknown> },
): void {
  try {
    posthog.captureException(error, {
      tags: {
        source: context?.source ?? 'client',
        digest: context?.digest,
      },
      ...(context?.extra ?? {}),
    })
  } catch {
    // ignore
  }

  try {
    fetch('/api/client-error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack,
        source: context?.source ?? 'client',
        digest: context?.digest,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined,
        extra: context?.extra,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // ignore
  }
}
