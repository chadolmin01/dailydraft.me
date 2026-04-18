import { PostHog } from 'posthog-node'
import { logError, sanitizeBody, type LogErrorOptions } from '@/src/lib/error-logging'

let _client: PostHog | null = null

function getClient(): PostHog | null {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (_client) return _client
  _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })
  return _client
}

export interface ServerErrorContext {
  route: string
  userId?: string
  method?: string
  statusCode?: number
  durationMs?: number
  ip?: string
  userAgent?: string
  query?: Record<string, unknown>
  requestBody?: Record<string, unknown>
  digest?: string
  source?: 'api' | 'cron' | 'webhook' | 'middleware' | 'client'
  jobName?: string
  extra?: Record<string, unknown>
}

/**
 * 서버사이드 에러를 PostHog로 전송
 *
 * Vercel serverless에서 응답 반환 직후 함수가 frozen되면 fire-and-forget HTTP가
 * 끊겨 캡처가 누락됨. flush()를 await해서 전송 보장.
 */
export async function captureServerError(
  error: unknown,
  context: ServerErrorContext
): Promise<void> {
  const client = getClient()
  if (!client) return

  const err = error instanceof Error ? error : new Error(String(error))

  // distinctId: userId → cron:<job> → 'server'
  const distinctId =
    context.userId ??
    (context.jobName ? `cron:${context.jobName}` : 'server')

  // sanitize any PII before sending
  const safeBody = context.requestBody ? sanitizeBody(context.requestBody) : undefined
  const safeQuery = context.query ? sanitizeBody(context.query) : undefined
  const safeExtra = context.extra ? sanitizeBody(context.extra) : undefined

  client.capture({
    distinctId,
    event: '$exception',
    properties: {
      $exception_type: err.name,
      $exception_message: err.message,
      $exception_stack: err.stack,
      route: context.route,
      method: context.method,
      statusCode: context.statusCode,
      durationMs: context.durationMs,
      ip: context.ip,
      userAgent: context.userAgent,
      query: safeQuery,
      requestBody: safeBody,
      digest: context.digest,
      source: context.source ?? 'api',
      jobName: context.jobName,
      ...safeExtra,
    },
  })

  // Vercel serverless 안전장치 — 전송 완료까지 대기
  try {
    await client.flush()
  } catch {
    // flush 실패해도 호출자 흐름은 보호
  }
}

/**
 * 크론 작업 완료 이벤트를 PostHog에 전송한다.
 * 에러가 아닌 비즈니스 이벤트 — PostHog 대시보드에서 크론 성공률 모니터링 가능.
 *
 * draftsCreated=0 && processed>0 같은 "조용한 실패"도 감지할 수 있게 해 줌.
 */
export async function captureServerEvent(
  eventName: string,
  properties: Record<string, unknown> & { userId?: string; jobName?: string }
): Promise<void> {
  const client = getClient()
  if (!client) return

  // distinctId 우선순위: userId (유저 퍼널) → cron:<job> → 'server'
  // 온보딩·가입 funnel 이벤트는 반드시 userId 를 넘겨서 유저별 집계 가능하게 해야 함.
  const distinctId = properties.userId
    ? String(properties.userId)
    : properties.jobName
    ? `cron:${properties.jobName}`
    : 'server'

  client.capture({
    distinctId,
    event: eventName,
    properties: sanitizeBody(properties),
  })

  try {
    await client.flush()
  } catch {
    // flush 실패해도 호출자 흐름은 보호
  }
}

/**
 * PostHog + error_logs DB에 동시에 에러 전송.
 * 한 쪽이 실패해도 다른 쪽에는 전달되도록 Promise.allSettled 사용.
 */
export async function captureAndLog(
  error: unknown,
  context: ServerErrorContext
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error))

  const dbPayload: LogErrorOptions = {
    level: 'error',
    source: context.source === 'middleware' ? 'api' : (context.source ?? 'api'),
    errorCode: err.name,
    message: err.message,
    stackTrace: err.stack,
    endpoint: context.jobName ?? context.route,
    method: context.method,
    userId: context.userId,
    requestBody: context.requestBody,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: {
      durationMs: context.durationMs,
      statusCode: context.statusCode,
      digest: context.digest,
      query: context.query,
      ...(context.jobName ? { jobName: context.jobName } : {}),
    },
  }

  await Promise.allSettled([
    captureServerError(error, context).catch(() => {}),
    logError(dbPayload).catch(() => {}),
  ])
}
