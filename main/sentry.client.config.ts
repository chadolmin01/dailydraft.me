import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 유저 20명 수준 → 100% 트레이싱으로 전부 캡처
  tracesSampleRate: 1.0,

  // 세션 리플레이: 에러 발생 시 100%, 평소 10%
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // 개발환경에서는 콘솔에만 출력
  debug: false,

  // 무시할 에러 (네트워크 이슈, 브라우저 확장 등 노이즈)
  ignoreErrors: [
    'AbortError',
    'NetworkError',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /^Loading chunk \d+ failed/,
    /^Failed to fetch$/,
  ],
})
