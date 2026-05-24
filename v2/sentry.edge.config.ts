// Sentry edge runtime init (middleware 등 edge functions).
// 의도: SENTRY_DSN 없으면 init() 가 silent no-op.

import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    sendDefaultPii: false,
  })
}
