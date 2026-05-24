// Sentry 클라이언트 사이드 init (브라우저).
// 의도: Next 15 의 instrumentation-client.ts 패턴 — 페이지 로드 시 자동 실행.
//       NEXT_PUBLIC_SENTRY_DSN 없으면 init() 가 silent no-op.

import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1, // 클라 트래픽 많을 가능성 → 10% sampling
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    // PII 차단 (cookie, IP, form data, breadcrumb URL params)
    sendDefaultPii: false,
    // 의도: Replay 는 PoC 단계엔 비활성 (bundle size + privacy). 매니저 UX 디버깅 필요 시 활성.
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
  })
}

// Next 15 의 router transition tracking (PageView 이벤트). DSN 없어도 호출 안전.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
