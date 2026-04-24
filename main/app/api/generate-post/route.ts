import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ApiResponse } from '@/src/lib/api-utils'
import { cookies } from 'next/headers'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit/api-rate-limiter'
import { logApiError } from '@/src/lib/error-logging'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const systemPrompt = `당신은 대학생/예비창업자를 위한 프로젝트 공고 작성 전문가입니다.
주어진 정보를 바탕으로 매력적이고 구체적인 프로젝트 공고를 작성해주세요.

각 필드 작성 규칙:
1. title: 프로젝트 한 줄 소개 (20자 이내)
2. problem: 우리가 해결하려는 문제 (2-3문장)
3. status: 현재 진행 상황 (MVP/아이디어/런칭 등)
4. neededRoles: 필요한 팀원 역할과 기대하는 역량 (배열)
5. whyJoin: 함께하면 좋은 이유 (1-2문장)
6. tags: 관련 태그 3개 이상`

// 출력 스키마. 기존 수동 JSON 파싱 + 마크다운 코드 블록 제거 로직을 대체.
const PostSchema = z.object({
  title: z.string().describe('프로젝트 한 줄 소개 (20자 이내)'),
  problem: z.string().describe('우리가 해결하려는 문제 (2-3문장)'),
  status: z.string().describe('현재 진행 상황'),
  neededRoles: z.array(z.string()).describe('필요한 팀원 역할 목록'),
  whyJoin: z.string().describe('함께하면 좋은 이유 (1-2문장)'),
  tags: z.array(z.string()).describe('관련 태그 3개 이상'),
})

interface RequestBody {
  role: string // 창업자, 예비창업자, 합류희망자
  neededRoles: string[] // 개발자, 디자이너, 기획자, 마케터
  field: string // AI·테크, 커머스, 헬스케어, 에듀테크, 소셜임팩트
  description: string // 프로젝트 한 줄 설명
  painPoint?: string // 고민 포인트 (선택)
}

export const POST = withErrorCapture(async (request: NextRequest) => {
  try {
    // Auth check
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]) } catch { /* read-only */ }
            })
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return ApiResponse.unauthorized()
    }

    // Rate limit: prevent API credit abuse
    const rateLimitResponse = applyRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const body: RequestBody = await request.json()

    if (!body.role || !body.neededRoles || !body.field || !body.description) {
      return ApiResponse.badRequest('Missing required fields: role, neededRoles, field, description')
    }

    // Input length validation
    if (body.description.length > 500) {
      return ApiResponse.badRequest('Description too long (max 500 chars)')
    }
    if (body.neededRoles.length > 10) {
      return ApiResponse.badRequest('Too many roles (max 10)')
    }
    if (body.field.length > 50 || body.role.length > 50) {
      return ApiResponse.badRequest('Field/role too long (max 50 chars)')
    }

    const userPrompt = `
역할: ${body.role} (창업자/예비창업자/합류희망자)
찾는 팀원: ${body.neededRoles.join(', ')}
관심 분야: ${body.field}
프로젝트 설명: ${body.description}
${body.painPoint ? `고민 포인트: ${body.painPoint}` : ''}

위 정보를 바탕으로 프로젝트 공고를 작성해주세요.`

    const { object: generatedPost } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: PostSchema,
      system: systemPrompt,
      prompt: userPrompt,
    })

    return ApiResponse.ok({
      success: true,
      data: generatedPost,
    })
  } catch (error) {
    logApiError(error, request).catch(() => {})

    return ApiResponse.internalError()
  }
})
