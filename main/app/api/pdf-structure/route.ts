import { createClient } from '@/src/lib/supabase/server'
import { genAI } from '@/src/lib/ai/gemini-client'
import { ApiResponse } from '@/src/lib/api-utils'
import { applyRateLimit } from '@/src/lib/rate-limit'
import { logError } from '@/src/lib/error-logging'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import { PdfStructureSchema } from '@/src/lib/ai/schemas'

const SYSTEM_PROMPT = `당신은 스타트업 PM입니다. 업로드된 PDF 문서를 분석하여 다음 3가지를 추출하세요.
문서에 명시되지 않은 내용은 "내용 없음"으로 표기하세요.

반드시 아래 JSON 형식으로만 반환하세요:
{
  "problem": "해결하려는 문제",
  "solution": "핵심 솔루션",
  "target": "타겟 고객"
}`

export interface StructuredIdea {
  problem: string
  solution: string
  target: string
}

export async function POST(request: Request) {
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

    // 문서를 base64로 변환 → Gemini에 직접 전송
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const { data: structured } = await safeGenerate({
      model,
      prompt: {
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: '이 문서를 분석해주세요.' }
          ]
        }],
        systemInstruction: { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
      },
      schema: PdfStructureSchema,
      extractJson: 'object',
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
}
