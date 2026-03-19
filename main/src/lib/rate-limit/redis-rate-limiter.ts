/**
 * Redis-based Rate Limiter (Upstash)
 * 프로덕션용 분산 Rate Limiting
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// Upstash Redis 클라이언트 (환경변수에서 자동 로드)
const redis = Redis.fromEnv()

// 기본 정책: slidingWindow(30, "60 s") — 온보딩 AI 대화 플로우 고려
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: 'ratelimit:api',
})

// View count 전용 (더 관대한 정책)
const viewRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: true,
  prefix: 'ratelimit:view',
})

/**
 * AI 엔드포인트용 rate limit 체크
 * @returns NextResponse(429) if rate limited, null if allowed
 */
export async function checkAIRateLimit(
  userId: string | null,
  ip: string = 'unknown'
): Promise<NextResponse | null> {
  const identifier = userId ? `user:${userId}` : `ip:${ip}`

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
  } catch (error) {
    // Redis 연결 실패 시 요청을 차단하지 않음 (graceful degradation)
    console.warn('Redis rate limit check failed, allowing request:', error)
  }

  return null
}

/**
 * View count 전용 rate limit 체크
 */
export async function checkViewRateLimit(
  ip: string = 'unknown'
): Promise<NextResponse | null> {
  const identifier = `ip:${ip}`

  try {
    const { success, limit, remaining, reset } = await viewRatelimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: '조회수 요청 한도를 초과했습니다.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }
  } catch (error) {
    console.warn('Redis view rate limit check failed, allowing request:', error)
  }

  return null
}

/**
 * IP 추출 유틸리티
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers)

  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
