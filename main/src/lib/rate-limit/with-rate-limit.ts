/**
 * Rate Limit HOF (Higher Order Function)
 * API 라우트에 Rate Limit을 적용하는 래퍼
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  checkRateLimit,
  getRateLimitHeaders,
  createRateLimitError,
  type RateLimitResult,
} from './api-rate-limiter'
import { getUserSubscription } from '@/src/lib/subscription/usage-checker'
import type { PlanType } from '@/src/lib/subscription/constants'

type RouteHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse | Promise<Response> | Response

interface RateLimitOptions {
  // 특정 엔드포인트에 대한 커스텀 한도 (기본 플랜 한도 대신 사용)
  customLimit?: number
  // 인증 필수 여부
  requireAuth?: boolean
  // Rate limit을 건너뛸 조건
  skipIf?: (request: NextRequest) => boolean
}

/**
 * API 라우트에 Rate Limit을 적용합니다.
 *
 * @example
 * export const GET = withRateLimit(async (request) => {
 *   // ... handler logic
 * })
 *
 * @example
 * export const POST = withRateLimit(
 *   async (request) => {
 *     // ... handler logic
 *   },
 *   { requireAuth: true }
 * )
 */
export function withRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions = {}
): RouteHandler {
  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }) => {
    // Skip 조건 체크
    if (options.skipIf?.(request)) {
      return handler(request, context)
    }

    // 사용자 식별 (userId 또는 IP)
    const { identifier, planType } = await getIdentifierAndPlan(request, options.requireAuth)

    if (options.requireAuth && !identifier.startsWith('user:')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // Rate limit 체크
    const result = checkRateLimit(identifier, planType)

    // Rate limit 헤더 추가
    const headers = getRateLimitHeaders(result)

    if (!result.allowed) {
      return NextResponse.json(createRateLimitError(result), {
        status: 429,
        headers,
      })
    }

    // 원래 핸들러 실행
    const response = await handler(request, context)

    // 응답에 Rate limit 헤더 추가
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * 사용자 식별자와 플랜 타입을 가져옵니다.
 */
async function getIdentifierAndPlan(
  request: NextRequest,
  requireAuth?: boolean
): Promise<{ identifier: string; planType: PlanType | 'anonymous' }> {
  // 먼저 인증된 사용자인지 확인
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        const subscription = await getUserSubscription(supabase, user.id)
        return {
          identifier: `user:${user.id}`,
          planType: subscription.planType,
        }
      }
    }

    // 쿠키 기반 인증 시도
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      // Supabase 세션 쿠키에서 사용자 정보 추출 시도
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const subscription = await getUserSubscription(supabase, user.id)
        return {
          identifier: `user:${user.id}`,
          planType: subscription.planType,
        }
      }
    }
  } catch {
    // 인증 실패 시 IP 기반으로 폴백
  }

  // 인증되지 않은 요청 - IP 기반
  const ip = getClientIP(request)
  return {
    identifier: `ip:${ip}`,
    planType: 'anonymous',
  }
}

/**
 * 클라이언트 IP 주소를 가져옵니다.
 */
function getClientIP(request: NextRequest): string {
  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return cfIP

  // X-Forwarded-For (프록시/로드밸런서)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // X-Real-IP
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return realIP

  // 기본값
  return 'unknown'
}

/**
 * Rate limit 상태만 확인 (카운트 증가 없이)
 */
export async function getRateLimitStatus(
  request: NextRequest
): Promise<{ identifier: string; planType: PlanType | 'anonymous'; result: RateLimitResult }> {
  const { identifier, planType } = await getIdentifierAndPlan(request)
  const result = checkRateLimit(identifier, planType)

  return { identifier, planType, result }
}
