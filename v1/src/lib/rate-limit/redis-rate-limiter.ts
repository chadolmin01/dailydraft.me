/**
 * Redis-based Rate Limiter (Upstash)
 * 프로덕션용 분산 Rate Limiting
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { checkRateLimit as checkInMemoryRateLimit, createRateLimitError, getRateLimitHeaders } from './api-rate-limiter'

// Lazy-initialized Redis client — avoids crash when env vars are missing
let _redis: Redis | null = null
let _ratelimit: Ratelimit | null = null
let _viewRatelimit: Ratelimit | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
    _redis = Redis.fromEnv()
    return _redis
  } catch {
    return null
  }
}

function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit
  const redis = getRedis()
  if (!redis) return null
  _ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: true,
    prefix: 'ratelimit:api',
  })
  return _ratelimit
}

function getViewRatelimit(): Ratelimit | null {
  if (_viewRatelimit) return _viewRatelimit
  const redis = getRedis()
  if (!redis) return null
  _viewRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: true,
    prefix: 'ratelimit:view',
  })
  return _viewRatelimit
}

/**
 * AI 엔드포인트용 rate limit 체크
 * @returns NextResponse(429) if rate limited, null if allowed
 */
export async function checkAIRateLimit(
  userId: string | null,
  ip: string = 'unknown'
): Promise<NextResponse | null> {
  const identifier = userId ? `user:${userId}` : `ip:${ip}`
  const rl = getRatelimit()

  // No Redis available → fall back to in-memory rate limiter
  if (!rl) {
    const result = checkInMemoryRateLimit(identifier, userId ? 'free' : 'anonymous')
    if (!result.allowed) {
      return NextResponse.json(createRateLimitError(result), {
        status: 429,
        headers: getRateLimitHeaders(result),
      })
    }
    return null
  }

  try {
    const { success, limit, remaining, reset } = await rl.limit(identifier)

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
    // Redis failure → fall back to in-memory rate limiter instead of open
    console.warn('Redis rate limit check failed, using in-memory fallback:', error)
    const result = checkInMemoryRateLimit(identifier, userId ? 'free' : 'anonymous')
    if (!result.allowed) {
      return NextResponse.json(createRateLimitError(result), {
        status: 429,
        headers: getRateLimitHeaders(result),
      })
    }
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
  const rl = getViewRatelimit()

  // No Redis → in-memory fallback
  if (!rl) {
    const result = checkInMemoryRateLimit(identifier, 'anonymous')
    if (!result.allowed) {
      return NextResponse.json(createRateLimitError(result), {
        status: 429,
        headers: getRateLimitHeaders(result),
      })
    }
    return null
  }

  try {
    const { success, limit, remaining, reset } = await rl.limit(identifier)

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
    console.warn('Redis view rate limit check failed, using in-memory fallback:', error)
    const result = checkInMemoryRateLimit(identifier, 'anonymous')
    if (!result.allowed) {
      return NextResponse.json(createRateLimitError(result), {
        status: 429,
        headers: getRateLimitHeaders(result),
      })
    }
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
