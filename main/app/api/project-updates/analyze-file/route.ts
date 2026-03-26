import { createClient } from '@/src/lib/supabase/server'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'

const TEXT_PROMPT = `이 파일 내용을 분석하여 프로젝트 팀 주간 업데이트로 변환해주세요.

작성 규칙:
1. 첫 줄: 이번 주 핵심 성과를 한 문장으로 (구체적이고 간결하게)
2. 필요시 둘째 줄부터 간략한 상세 내용
3. 팀원에게 공유하는 자연스러운 한국어
4. 총 200자 이내

파일 내용:
`

const IMAGE_PROMPT = `이 화면/이미지를 보고 프로젝트 팀 주간 업데이트로 변환해주세요.

작성 규칙:
1. 첫 줄: 이미지에서 확인되는 핵심 성과를 한 문장으로
2. 필요시 둘째 줄부터 간략한 상세 내용
3. 팀원에게 공유하는 자연스러운 한국어
4. 총 200자 이내`

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_TEXT_LENGTH = 8000

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const rateLimitResponse = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return ApiResponse.badRequest('파일이 없습니다')
    if (file.size > MAX_FILE_SIZE) return ApiResponse.badRequest('파일이 너무 큽니다 (최대 10MB)')

    let result

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const prompt = file.type.startsWith('image/') ? IMAGE_PROMPT : TEXT_PROMPT + '(PDF 문서)'
      result = await chatModel.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: file.type, data: base64 } },
            { text: prompt },
          ],
        }],
      })
    } else {
      const text = (await file.text()).slice(0, MAX_TEXT_LENGTH)
      result = await chatModel.generateContent(TEXT_PROMPT + text)
    }

    const content = result.response.text().trim()
    return ApiResponse.ok({ content })
  } catch (error) {
    console.error('[analyze-file] error:', error)
    return ApiResponse.internalError()
  }
}
