// Sentry 서버 사이드 init (Node runtime).
// 의도: SENTRY_DSN 없으면 init() 가 silent no-op → 개발/CI 환경에서 빌드 안 깨짐.
//       프로덕션에 DSN 등록 시 자동으로 에러 추적 시작.

import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // 의도: PoC 단계 → 모든 에러 (1.0). 사용자 늘면 0.1~0.3 으로 sampling.
    tracesSampleRate: 1.0,
    // 환경 구분 (dev/staging/production)
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    // PII 자동 수집 차단 (cookie, IP, headers). 한국 PIPA 준수.
    sendDefaultPii: false,
    // 로컬 개발에선 콘솔에도 출력 (디버깅)
    debug: false,
  })
}
