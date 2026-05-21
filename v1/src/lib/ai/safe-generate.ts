import { z } from 'zod'

export class SafeGenerateError extends Error {
  constructor(
    message: string,
    public raw: string,
    public zodErrors?: z.ZodError,
  ) {
    super(message)
  }
}

/**
 * Extract JSON text from AI response that may include markdown code blocks
 */
function extractJsonText(text: string, mode: 'object' | 'array'): string {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const pattern = mode === 'object' ? /\{[\s\S]*\}/ : /\[[\s\S]*\]/
  const match = cleaned.match(pattern)
  if (!match) throw new Error(`No JSON ${mode} found in response`)
  return match[0]
}

/**
 * AI 응답을 Zod 스키마로 검증하고, 실패 시 자동 재시도하는 래퍼.
 *
 * - JSON 파싱 또는 Zod 검증 실패만 재시도 (네트워크/SDK 에러는 즉시 throw)
 * - schema.default() 값이 누락된 필드를 자동 보정
 * - 최종 실패 시 schema.parse({})로 전체 기본값 반환 시도
 */
export async function safeGenerate<T>(options: {
  model: { generateContent: (input: any) => Promise<any> }
  prompt: string | Record<string, any>
  schema: z.ZodType<T>
  extractJson?: 'object' | 'array'
  maxRetries?: number
}): Promise<{ data: T; raw: string }> {
  const { model, prompt, schema, maxRetries = 1 } = options

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Network/SDK errors here bubble up immediately (no retry)
    const result = await model.generateContent(prompt)
    const raw = result.response.text()

    try {
      const jsonStr = options.extractJson
        ? extractJsonText(raw, options.extractJson)
        : raw
      const parsed = JSON.parse(jsonStr)
      const validated = schema.parse(parsed)
      return { data: validated, raw }
    } catch (err) {
      if (attempt < maxRetries) {
        console.warn(`[safeGenerate] attempt ${attempt + 1} failed, retrying...`)
        await new Promise(r => setTimeout(r, 150 * Math.pow(1.5, attempt)))
        continue
      }

      // Final fallback: try schema.parse({}) to get all defaults
      try {
        const fallback = schema.parse({})
        console.warn('[safeGenerate] returning fallback defaults after all retries failed')
        return { data: fallback, raw }
      } catch {
        // fallback didn't work (e.g., array schemas)
      }

      throw new SafeGenerateError(
        'AI 응답 검증 실패',
        raw,
        err instanceof z.ZodError ? err : undefined,
      )
    }
  }

  throw new Error('unreachable')
}
