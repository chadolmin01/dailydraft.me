// Next 15 의 서버 사이드 instrumentation hook.
// Server 또는 edge runtime 시작 시 1회 호출 → Sentry init 트리거.
// 의도: Next 15 의 sentry init 표준 경로 (sentry.server/edge.config.ts 자동 import X).

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export { captureRequestError as onRequestError } from '@sentry/nextjs'
