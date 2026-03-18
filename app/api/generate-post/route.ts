import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ApiResponse } from '@/src/lib/api-utils'
import { cookies } from 'next/headers'
import Anthropic from '@anthropic-ai/sdk'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit/api-rate-limiter'
import { logApiError } from '@/src/lib/error-logging'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const systemPrompt = `당신은 대학생/예비창업자를 위한 프로젝트 공고 작성 전문가입니다.
주어진 정보를 바탕으로 매력적이고 구체적인 프로젝트 공고를 작성해주세요.

공고 형식:
1. 프로젝트 한 줄 소개 (20자 이내, title 필드)
2. 우리가 해결하려는 문제 (2-3문장, problem 필드)
3. 현재 진행 상황 (MVP/아이디어/런칭 등, status 필드)
4. 필요한 팀원 역할과 기대하는 역량 (배열, neededRoles 필드)
5. 함께하면 좋은 이유 (1-2문장, whyJoin 필드)

응답은 반드시 JSON 형식으로만 작성해주세요. 설명이나 다른 텍스트 없이 순수 JSON만 반환하세요.`

interface RequestBody {
  role: string // 창업자, 예비창업자, 합류희망자
  neededRoles: string[] // 개발자, 디자이너, 기획자, 마케터
  field: string // AI·테크, 커머스, 헬스케어, 에듀테크, 소셜임팩트
  description: string // 프로젝트 한 줄 설명
  painPoint?: string // 고민 포인트 (선택)
}

interface GeneratedPost {
  title: string
  problem: string
  status: string
  neededRoles: string[]
  whyJoin: string
  tags: string[]
}

export async function POST(request: NextRequest) {
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
              try { cookieStore.set(name, value, options as any) } catch { /* read-only */ }
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

위 정보를 바탕으로 프로젝트 공고를 작성해주세요.
응답은 다음 JSON 형식으로만 작성해주세요:
{
  "title": "프로젝트 한 줄 소개 (20자 이내)",
  "problem": "우리가 해결하려는 문제 (2-3문장)",
  "status": "현재 진행 상황",
  "neededRoles": ["필요한 역할1", "필요한 역할2"],
  "whyJoin": "함께하면 좋은 이유 (1-2문장)",
  "tags": ["관련 태그1", "관련 태그2", "관련 태그3"]
}`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    })

    // Extract text content from response
    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response')
    }

    // Parse JSON response
    let generatedPost: GeneratedPost
    try {
      // Remove any markdown code blocks if present
      let jsonStr = textContent.text.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7)
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3)
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3)
      }
      generatedPost = JSON.parse(jsonStr.trim())
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text)
      throw new Error('Failed to parse AI response as JSON')
    }

    return NextResponse.json({
      success: true,
      data: generatedPost,
    })
  } catch (error) {
    logApiError(error, request).catch(() => {})

    return ApiResponse.internalError()
  }
}
