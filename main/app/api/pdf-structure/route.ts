import { createClient } from '@/src/lib/supabase/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { ApiResponse } from '@/src/lib/api-utils'
import { applyRateLimit } from '@/src/lib/rate-limit'
import { logError } from '@/src/lib/error-logging'
import { PdfStructureSchema } from '@/src/lib/ai/schemas'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

const SYSTEM_PROMPT = `당신은 스타트업 PM입니다. 업로드된 PDF 문서를 분석하여 다음 3가지를 추출하세요.
문서에 명시되지 않은 내용은 "내용 없음"으로 표기하세요.

출력 필드:
- problem: 해결하려는 문제
- solution: 핵심 솔루션
- target: 타겟 고객`

export interface StructuredIdea {
  problem: string
  solution: string
  target: string
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export const POST = withErrorCapture(async (request) => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const rateLimitResponse = applyRateLimit(user.id)
    if (rateLimitResponse) return rateLimitResponse

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return ApiResponse.badRequest('No file provided')
    }

    if (file.size > 10 * 1024 * 1024) {
      return ApiResponse.badRequest('File too large (max 10MB)')
    }

    // 파일 MIME 타입 결정
    const ext = file.name.toLowerCase().split('.').pop()
    const mimeTypeMap: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
    }
    const mimeType = mimeTypeMap[ext || ''] || file.type || 'application/pdf'

    // AI SDK 의 file content part — Buffer 를 그대로 전달, base64 변환 자동.
    // 기존 수동 base64 인코딩 + inlineData 구조 + safeGenerate JSON 파싱 로직을 한 번에 대체.
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { object: structured } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: PdfStructureSchema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'file', data: fileBuffer, mediaType: mimeType },
            { type: 'text', text: '이 문서를 분석해주세요.' },
          ],
        },
      ],
      temperature: 0.3,
    })

    return ApiResponse.ok({ data: structured })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/pdf-structure',
      method: 'POST',
    })
    console.error('pdf-structure error:', err.message)
    return ApiResponse.internalError()
  }
})
