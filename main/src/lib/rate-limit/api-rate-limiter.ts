/**
 * API Rate Limiter
 * 사용자/IP 기반 API 호출 제한
 * 플랜별 다른 한도 적용
 */

import { PLAN_TYPES, type PlanType } from '@/src/lib/subscription/constants'

// ================================================
// Rate Limit 설정 (분당 요청 수)
// ================================================
export const RATE_LIMITS = {
  [PLAN_TYPES.FREE]: {
    requestsPerMinute: 60,
    requestsPerHour: 500,
    requestsPerDay: 5000,
  },
  [PLAN_TYPES.PRO]: {
    requestsPerMinute: 300,
    requestsPerHour: 3000,
    requestsPerDay: 30000,
  },
  [PLAN_TYPES.TEAM]: {
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
  },
  // 인증되지 않은 요청 (IP 기반)
  anonymous: {
    requestsPerMinute: 20,
    requestsPerHour: 100,
    requestsPerDay: 500,
  },
} as const

// ================================================
// 메모리 기반 Rate Limit 저장소
// 프로덕션에서는 Redis 사용 권장
// ================================================
interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitStore {
  minute: Map<string, RateLimitEntry>
  hour: Map<string, RateLimitEntry>
  day: Map<string, RateLimitEntry>
}

const store: RateLimitStore = {
  minute: new Map(),
  hour: new Map(),
  day: new Map(),
}

// 정리 인터벌 (5분마다 만료된 항목 정리)
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupInterval) return

  cleanupInterval = setInterval(() => {
    const now = Date.now()

    for (const [key, map] of Object.entries(store)) {
      for (const [id, entry] of (map as Map<string, RateLimitEntry>).entries()) {
        if (entry.resetAt < now) {
          (map as Map<string, RateLimitEntry>).delete(id)
        }
      }
    }
  }, 5 * 60 * 1000)
}

// 서버 시작 시 정리 시작
if (typeof window === 'undefined') {
  startCleanup()
}

// ================================================
// Rate Limit 체크 결과
// ================================================
export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfter?: number // 초 단위
  window: 'minute' | 'hour' | 'day'
}

// ================================================
// Rate Limit 체크 함수
// ================================================
export function checkRateLimit(
  identifier: string, // userId 또는 IP
  planType: PlanType | 'anonymous' = 'anonymous'
): RateLimitResult {
  const now = Date.now()
  const limits = RATE_LIMITS[planType]

  // 분 단위 체크
  const minuteResult = checkWindow(
    identifier,
    'minute',
    limits.requestsPerMinute,
    60 * 1000,
    now
  )
  if (!minuteResult.allowed) {
    return minuteResult
  }

  // 시간 단위 체크
  const hourResult = checkWindow(
    identifier,
    'hour',
    limits.requestsPerHour,
    60 * 60 * 1000,
    now
  )
  if (!hourResult.allowed) {
    return hourResult
  }

  // 일 단위 체크
  const dayResult = checkWindow(
    identifier,
    'day',
    limits.requestsPerDay,
    24 * 60 * 60 * 1000,
    now
  )
  if (!dayResult.allowed) {
    return dayResult
  }

  // 모든 체크 통과 - 카운트 증가
  incrementCount(identifier, 'minute', 60 * 1000, now)
  incrementCount(identifier, 'hour', 60 * 60 * 1000, now)
  incrementCount(identifier, 'day', 24 * 60 * 60 * 1000, now)

  // 가장 제한적인 결과 반환
  return minuteResult
}

function checkWindow(
  identifier: string,
  window: 'minute' | 'hour' | 'day',
  limit: number,
  windowMs: number,
  now: number
): RateLimitResult {
  const key = `${identifier}:${window}`
  const map = store[window]
  const entry = map.get(key)

  if (!entry || entry.resetAt < now) {
    // 새 윈도우 시작
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: now + windowMs,
      window,
    }
  }

  const remaining = limit - entry.count - 1

  if (remaining < 0) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      window,
    }
  }

  return {
    allowed: true,
    limit,
    remaining,
    resetAt: entry.resetAt,
    window,
  }
}

function incrementCount(
  identifier: string,
  window: 'minute' | 'hour' | 'day',
  windowMs: number,
  now: number
): void {
  const key = `${identifier}:${window}`
  const map = store[window]
  const entry = map.get(key)

  if (!entry || entry.resetAt < now) {
    map.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
  } else {
    entry.count++
  }
}

// ================================================
// 사용량 조회 (대시보드용)
// ================================================
export interface UsageStats {
  minute: { used: number; limit: number; resetAt: number }
  hour: { used: number; limit: number; resetAt: number }
  day: { used: number; limit: number; resetAt: number }
}

export function getUsageStats(
  identifier: string,
  planType: PlanType | 'anonymous' = 'anonymous'
): UsageStats {
  const now = Date.now()
  const limits = RATE_LIMITS[planType]

  const getWindowStats = (window: 'minute' | 'hour' | 'day', windowMs: number, limit: number) => {
    const key = `${identifier}:${window}`
    const entry = store[window].get(key)

    if (!entry || entry.resetAt < now) {
      return { used: 0, limit, resetAt: now + windowMs }
    }

    return { used: entry.count, limit, resetAt: entry.resetAt }
  }

  return {
    minute: getWindowStats('minute', 60 * 1000, limits.requestsPerMinute),
    hour: getWindowStats('hour', 60 * 60 * 1000, limits.requestsPerHour),
    day: getWindowStats('day', 24 * 60 * 60 * 1000, limits.requestsPerDay),
  }
}

// ================================================
// Rate Limit 헤더 생성 (RFC 표준)
// ================================================
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  }
}

// ================================================
// Rate Limit 에러 응답 생성
// ================================================
export function createRateLimitError(result: RateLimitResult) {
  const windowNames = {
    minute: '분',
    hour: '시간',
    day: '일',
  }

  return {
    error: 'Too Many Requests',
    message: `API 요청 한도를 초과했습니다. ${result.retryAfter}초 후에 다시 시도해주세요.`,
    code: 'RATE_LIMIT_EXCEEDED',
    details: {
      window: result.window,
      windowName: windowNames[result.window],
      limit: result.limit,
      resetAt: new Date(result.resetAt).toISOString(),
      retryAfter: result.retryAfter,
    },
  }
}

// ================================================
// 간단한 Rate Limit 체크 (API 핸들러에서 직접 사용)
// ================================================
import { NextResponse } from 'next/server'

export function applyRateLimit(
  userId: string | null,
  clientIp: string = 'unknown'
): NextResponse | null {
  const identifier = userId ? `user:${userId}` : `ip:${clientIp}`
  const planType = userId ? 'free' : 'anonymous'

  const result = checkRateLimit(identifier, planType as PlanType | 'anonymous')

  if (!result.allowed) {
    return NextResponse.json(createRateLimitError(result), {
      status: 429,
      headers: getRateLimitHeaders(result),
    })
  }

  return null // Rate limit passed
}

export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers)

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  // X-Forwarded-For
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // X-Real-IP
  const realIP = headers.get('x-real-ip')
  if (realIP) return realIP

  return 'unknown'
}
