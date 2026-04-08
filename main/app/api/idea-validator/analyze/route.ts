import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { genAI } from '@/src/lib/ai/gemini-client'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { ApiResponse } from '@/src/lib/api-utils'
import { z } from 'zod'

// ── Zod Schemas ──

const CategoryScoreSchema = z.object({
  current: z.number(),
  max: z.number(),
  filled: z.boolean(),
})

const ScorecardSchema = z.object({
  problemDefinition: CategoryScoreSchema,
  solution: CategoryScoreSchema,
  marketAnalysis: CategoryScoreSchema,
  revenueModel: CategoryScoreSchema,
  differentiation: CategoryScoreSchema,
  logicalConsistency: CategoryScoreSchema,
  feasibility: CategoryScoreSchema,
  feedbackReflection: CategoryScoreSchema,
  totalScore: z.number(),
})

const DiscussionTurnSchema = z.object({
  persona: z.string(),
  message: z.string(),
  replyTo: z.string().nullable().optional(),
  tone: z.enum(['agree', 'disagree', 'question', 'suggestion', 'neutral']),
})

const DiscussionResponseSchema = z.object({
  discussion: z.array(DiscussionTurnSchema).min(4).max(6),
  responses: z.array(z.object({
    role: z.string(),
    name: z.string(),
    content: z.string(),
    tone: z.string().optional(),
  })).min(3),
  metrics: z.object({
    score: z.number().optional(),
    keyRisks: z.array(z.string()).optional(),
    keyStrengths: z.array(z.string()).optional(),
    summary: z.string(),
  }),
  scorecard: ScorecardSchema,
  categoryUpdates: z.array(z.object({
    category: z.string(),
    delta: z.number(),
    reason: z.string(),
  })),
  inputRelevance: z.object({
    isRelevant: z.boolean(),
    reason: z.string().optional(),
    warningMessage: z.string().optional(),
  }).optional(),
})

// ── Constants ──

const SCORECARD_CATEGORIES = [
  'problemDefinition', 'solution', 'marketAnalysis', 'revenueModel',
  'differentiation', 'logicalConsistency', 'feasibility', 'feedbackReflection',
] as const

const CATEGORY_INFO: Record<string, { nameKo: string; max: number }> = {
  problemDefinition: { nameKo: '문제 정의', max: 15 },
  solution: { nameKo: '솔루션', max: 15 },
  marketAnalysis: { nameKo: '시장 분석', max: 10 },
  revenueModel: { nameKo: '수익 모델', max: 10 },
  differentiation: { nameKo: '차별화', max: 10 },
  logicalConsistency: { nameKo: '논리 일관성', max: 15 },
  feasibility: { nameKo: '실현 가능성', max: 15 },
  feedbackReflection: { nameKo: '피드백 반영', max: 10 },
}

// ── Helpers ──

function escapePromptContent(content: string): string {
  if (!content) return ''
  return content
    .replace(/</g, '\uFF1C').replace(/>/g, '\uFF1E')
    .replace(/---+/g, '\u2014')
    .replace(/^(Human|Assistant|System|User):/gim, '$1\uFF1A')
    .replace(/```/g, '`\u200C`\u200C`')
}

function preValidateInput(input: string): { isValid: boolean; warning?: string } {
  const trimmed = input.trim()
  if (trimmed.length < 5) {
    return { isValid: false, warning: '입력이 너무 짧습니다. 아이디어에 대해 더 구체적으로 설명해주세요.' }
  }
  const meaningless = [/^[\u314B\u314E\u3160\u315C]+$/, /^[a-z]{1,4}$/i, /^(.)\1{3,}$/, /^[!@#$%^&*()]+$/, /^[0-9]+$/]
  for (const p of meaningless) {
    if (p.test(trimmed)) {
      return { isValid: false, warning: '의미 있는 내용을 입력해주세요. 아이디어 발전에 도움이 되는 답변을 부탁드립니다.' }
    }
  }
  return { isValid: true }
}

function isFeedbackResponse(idea: string): boolean {
  return idea.includes('[종합 결정 사항]') || /결정.*했|선택.*했|할게요|하겠습니다|로\s*정했/.test(idea)
}

type ScorecardData = z.infer<typeof ScorecardSchema>

function applyScoreCorrections(
  scorecard: ScorecardData,
  categoryUpdates: { category: string; delta: number; reason: string }[],
  currentScorecard: ScorecardData | null,
  idea: string,
  inputRelevance?: { isRelevant: boolean } | null
) {
  const corrected = structuredClone(scorecard)
  const correctedUpdates = structuredClone(categoryUpdates)
  const isRelevant = inputRelevance?.isRelevant !== false

  // Feedback reflection bonus
  if (isRelevant && isFeedbackResponse(idea) && corrected.feedbackReflection) {
    const cur = corrected.feedbackReflection.current || 0
    const bonus = Math.min(3, 10 - cur)
    if (bonus > 0) {
      corrected.feedbackReflection.current = cur + bonus
      corrected.feedbackReflection.filled = true
      const existing = correctedUpdates.find(u => u.category === 'feedbackReflection')
      if (existing) existing.delta += bonus
      else correctedUpdates.push({ category: 'feedbackReflection', delta: bonus, reason: '피드백 반영 완료' })
    }
  }

  let recalcTotal = 0
  let totalIncrease = 0

  for (const cat of SCORECARD_CATEGORIES) {
    const prev = currentScorecard?.[cat]?.current || 0
    const max = CATEGORY_INFO[cat].max

    // Prevent decrease
    if (corrected[cat].current < prev) corrected[cat].current = prev
    // Cap at max
    if (corrected[cat].current > max) corrected[cat].current = max
    // Keep filled
    if (currentScorecard?.[cat]?.filled) corrected[cat].filled = true
    if (corrected[cat].current > 0) corrected[cat].filled = true

    totalIncrease += corrected[cat].current - prev
    recalcTotal += corrected[cat].current
  }

  // Guarantee min +2 for relevant input
  if (isRelevant && totalIncrease < 2 && currentScorecard) {
    for (const cat of SCORECARD_CATEGORIES) {
      const cur = corrected[cat].current
      const max = CATEGORY_INFO[cat].max
      if (cur < max) {
        const add = Math.min(2, max - cur)
        corrected[cat].current += add
        corrected[cat].filled = true
        recalcTotal += add
        const ex = correctedUpdates.find(u => u.category === cat)
        if (ex) ex.delta += add
        else correctedUpdates.push({ category: cat, delta: add, reason: '대화 참여 보너스' })
        break
      }
    }
  }

  corrected.totalScore = recalcTotal
  const filteredUpdates = correctedUpdates.filter(u => u.delta > 0)
  return { scorecard: corrected, categoryUpdates: filteredUpdates }
}

async function callWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const error = err as { status?: number }
      if (error.status !== 429 || i === maxRetries - 1) throw err
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000 + Math.random() * 1000))
    }
  }
  throw new Error('Max retries exceeded')
}

function getScorecardValue(scorecard: ScorecardData | null, cat: string): number {
  if (!scorecard || cat === 'totalScore') return 0
  return (scorecard as Record<string, { current?: number }>)[cat]?.current ?? 0
}

// ── Prompt Builders ──

function buildOpinionPrompt(idea: string, historyContext: string): string {
  const safeIdea = escapePromptContent(idea)
  const safeHistory = escapePromptContent(historyContext)

  return `<context>
${safeHistory}
</context>

<user_input>${safeIdea}</user_input>

<personas>
- Developer (개발자): 기술적 실현 가능성, 아키텍처, 개발 비용을 검토
- Designer (디자이너): 사용자 경험, UI, 사용성, 접근성을 검토
- VC (투자자): 시장성, 수익 모델, 성장 잠재력, 경쟁 우위를 검토
</personas>

<instructions>
각 페르소나 관점에서 이 아이디어에 대한 의견을 작성하세요.

각 의견은:
- 강점 또는 기회 1가지 (근거 포함)
- 우려 또는 개선점 1가지 (구체적 보완 방법 포함)
- 총 4-5문장으로 작성

JSON 형식으로 출력:
{
  "Developer": "의견 내용...",
  "Designer": "의견 내용...",
  "VC": "의견 내용..."
}
</instructions>`
}

function buildSynthesisPrompt(
  idea: string,
  opinions: { persona: string; opinion: string }[],
  scorecard: ScorecardData | null,
  turnNumber: number
): string {
  const safeIdea = escapePromptContent(idea)
  const currentTotal = scorecard?.totalScore ?? 0
  const targetScore = 65
  const minIncrease = Math.max(5, Math.ceil((targetScore - currentTotal) / Math.max(1, 8 - turnNumber)))

  const opinionsText = opinions
    .map(o => `<opinion persona="${o.persona}">\n${escapePromptContent(o.opinion)}\n</opinion>`)
    .join('\n')

  return `<user_input>${safeIdea}</user_input>

<collected_opinions>
${opinionsText}
</collected_opinions>

<role>Draft AI - 스타트업 아이디어 검증 토론 코디네이터</role>

<discussion_rules>
- 4-6턴의 자연스러운 대화 (Developer, Designer, VC가 번갈아 발언)
- 각 턴은 2-3문장, 이전 발언자에게 반응 (replyTo 필수)
- tone: agree | disagree | question | suggestion | neutral
- 최소 1턴은 논리적 허점이나 리스크를 직접 지적하세요 (비판적 시각)
- 최소 1턴은 아무도 언급 안 한 새로운 기회나 피벗 방향을 제안하세요 (창의적 시각)
</discussion_rules>

<scorecard_rules>
- 점수는 항상 증가 (감소 절대 불가)
- 이번 턴 최소 증가: +${minIncrease}점
- 카테고리별 최대: problemDefinition 15, solution 15, marketAnalysis 10, revenueModel 10, differentiation 10, logicalConsistency 15, feasibility 15, feedbackReflection 10
- 새 정보 제공: +3~5, 피드백 반영: +5~8
</scorecard_rules>

<game_state>
턴: ${turnNumber}/8
현재: ${currentTotal}점 → 목표: ${targetScore}점
</game_state>

<current_scores>
problemDefinition: ${getScorecardValue(scorecard, 'problemDefinition')}/15
solution: ${getScorecardValue(scorecard, 'solution')}/15
marketAnalysis: ${getScorecardValue(scorecard, 'marketAnalysis')}/10
revenueModel: ${getScorecardValue(scorecard, 'revenueModel')}/10
differentiation: ${getScorecardValue(scorecard, 'differentiation')}/10
logicalConsistency: ${getScorecardValue(scorecard, 'logicalConsistency')}/15
feasibility: ${getScorecardValue(scorecard, 'feasibility')}/15
feedbackReflection: ${getScorecardValue(scorecard, 'feedbackReflection')}/10
totalScore: ${currentTotal} → 목표: ${currentTotal + minIncrease}+
</current_scores>

<input_validation>
입력이 아이디어 발전에 관련 있는지 판단하세요.
관련 없으면 inputRelevance.isRelevant=false, warningMessage에 안내 메시지를 포함하세요.
</input_validation>

<output_format>
JSON (DiscussionResponseSchema):
- discussion: [{persona, message, replyTo, tone}] (4-6턴)
- responses: [{role, name, content}] (Developer/Designer/VC 각 1개)
- metrics: {keyRisks:[], keyStrengths:[], summary}
- scorecard: 업데이트된 전체 점수
- categoryUpdates: [{category, delta, reason}]
- inputRelevance: {isRelevant:true}
</output_format>`
}

// ── POST Handler ──

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return ApiResponse.unauthorized('로그인이 필요합니다')
    }

    const rateLimitRes = await checkAIRateLimit(user.id, getClientIp(request))
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const { idea, conversationHistory = [], currentScorecard = null, turnNumber = 1 } = body

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return ApiResponse.badRequest('아이디어를 입력해주세요')
    }

    const sanitizedIdea = idea.slice(0, 5000)
    const validHistory = Array.isArray(conversationHistory)
      ? conversationHistory.filter((h: unknown) => typeof h === 'string').slice(0, 20).map((h: string) => h.slice(0, 2000))
      : []

    const encoder = new TextEncoder()

    // Pre-validate input
    const preValidation = preValidateInput(sanitizedIdea)
    if (!preValidation.isValid) {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'warning', data: { warning: preValidation.warning } })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })
      return new Response(stream, { headers: sseHeaders() })
    }

    const historyContext = validHistory.length > 0
      ? `[이전 대화]:\n${validHistory.join('\n')}\n\n`
      : ''

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false
        const send = (data: Uint8Array) => { if (!closed) try { controller.enqueue(data) } catch { closed = true } }
        const close = () => { if (!closed) { closed = true; controller.close() } }

        try {
          // ── Call 1: Opinions (JSON mode) ──
          const flashModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { maxOutputTokens: 1000, temperature: 0.8, responseMimeType: 'application/json' },
          })

          let opinions: { persona: string; opinion: string }[] = []
          try {
            const result = await callWithBackoff(() => flashModel.generateContent(buildOpinionPrompt(sanitizedIdea, historyContext)))
            const parsed = JSON.parse(result.response.text())
            opinions = ['Developer', 'Designer', 'VC'].map(p => ({
              persona: p,
              opinion: parsed[p] || '의견을 생성하지 못했습니다.',
            }))
          } catch (err) {
            console.error('Opinion generation failed:', err)
            opinions = ['Developer', 'Designer', 'VC'].map(p => ({
              persona: p,
              opinion: '의견을 불러오는 중 오류가 발생했습니다.',
            }))
          }

          // Stream opinions sequentially with delay
          for (const { persona, opinion } of opinions) {
            send(encoder.encode(`data: ${JSON.stringify({ type: 'opinion', data: { persona, message: opinion } })}\n\n`))
            await new Promise(r => setTimeout(r, 800))
          }

          // Synthesizing indicator
          send(encoder.encode(`data: ${JSON.stringify({ type: 'synthesizing', data: { message: 'AI가 토론을 종합하고 있습니다...' } })}\n\n`))

          // ── Call 2: Synthesis (JSON streaming) ──
          const synthesisModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: { maxOutputTokens: 3000, temperature: 0.65, responseMimeType: 'application/json' },
          })

          const synthesisPrompt = buildSynthesisPrompt(sanitizedIdea, opinions, currentScorecard, turnNumber)

          let finalData: Record<string, unknown> | null = null
          let sentDiscussionCount = 0

          try {
            const synthesisResult = await callWithBackoff(() =>
              synthesisModel.generateContentStream(synthesisPrompt)
            )

            let jsonBuffer = ''
            for await (const chunk of synthesisResult.stream) {
              jsonBuffer += chunk.text()

              // Incremental parsing: stream discussion turns as they appear
              try {
                const discussionMatch = jsonBuffer.match(/"discussion"\s*:\s*\[([\s\S]*)/)
                if (discussionMatch) {
                  const turnRegex = /\{[^{}]*"persona"\s*:\s*"[^"]*"[^{}]*"message"\s*:\s*"[^"]*"[^{}]*\}/g
                  const turns = discussionMatch[1].match(turnRegex) || []

                  for (let i = sentDiscussionCount; i < turns.length; i++) {
                    try {
                      const turn = JSON.parse(turns[i])
                      if (turn.persona && turn.message && turn.message.length > 20) {
                        send(encoder.encode(`data: ${JSON.stringify({ type: 'discussion', data: turn })}\n\n`))
                        sentDiscussionCount = i + 1
                      }
                    } catch { /* partial JSON */ }
                  }
                }
              } catch { /* continue buffering */ }
            }

            // Parse complete response
            const fullResponse = JSON.parse(jsonBuffer)
            const validated = DiscussionResponseSchema.safeParse(fullResponse)

            if (validated.success) {
              // Send remaining discussion turns
              const disc = validated.data.discussion || []
              for (let i = sentDiscussionCount; i < disc.length; i++) {
                send(encoder.encode(`data: ${JSON.stringify({ type: 'discussion', data: disc[i] })}\n\n`))
              }
              finalData = {
                responses: validated.data.responses,
                metrics: validated.data.metrics,
                scorecard: validated.data.scorecard,
                categoryUpdates: validated.data.categoryUpdates || [],
                inputRelevance: validated.data.inputRelevance,
              }
            } else {
              // Fallback: use raw parsed data
              finalData = {
                responses: fullResponse.responses || [],
                metrics: fullResponse.metrics || { summary: '검증 실패', keyStrengths: [], keyRisks: [] },
                scorecard: fullResponse.scorecard || currentScorecard,
                categoryUpdates: fullResponse.categoryUpdates || [],
                inputRelevance: fullResponse.inputRelevance,
              }
            }
          } catch (err) {
            console.error('Synthesis streaming error:', err)
            finalData = {
              responses: opinions.map(o => ({ role: o.persona, name: o.persona, content: o.opinion })),
              metrics: { summary: '합성 중 오류 발생', keyStrengths: [], keyRisks: [] },
              scorecard: currentScorecard,
              categoryUpdates: [],
            }
          }

          // Apply score corrections and send final
          if (finalData) {
            const { scorecard: correctedScorecard, categoryUpdates: correctedUpdates } = applyScoreCorrections(
              finalData.scorecard as ScorecardData,
              (finalData.categoryUpdates || []) as { category: string; delta: number; reason: string }[],
              currentScorecard,
              sanitizedIdea,
              finalData.inputRelevance as { isRelevant: boolean } | null
            )

            // Ensure all 3 personas have responses
            const responses = (finalData.responses || []) as { role: string }[]
            const roles = new Set(responses.map(r => r.role))
            for (const p of ['Developer', 'Designer', 'VC']) {
              if (!roles.has(p)) {
                const op = opinions.find(o => o.persona === p)
                responses.push({ role: p, name: p, content: op?.opinion || '의견 없음' } as any)
              }
            }

            const metrics = (finalData.metrics || {}) as Record<string, unknown>

            send(encoder.encode(`data: ${JSON.stringify({
              type: 'final',
              data: {
                responses,
                metrics: {
                  ...metrics,
                  keyStrengths: Array.isArray(metrics.keyStrengths) ? metrics.keyStrengths : [],
                  keyRisks: Array.isArray(metrics.keyRisks) ? metrics.keyRisks : [],
                  summary: metrics.summary || '',
                },
                scorecard: correctedScorecard,
                categoryUpdates: correctedUpdates,
              },
            })}\n\n`))
          }

          send(encoder.encode('data: [DONE]\n\n'))
          close()
        } catch (err) {
          console.error('Stream error:', err)
          send(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: { message: err instanceof Error ? err.message : 'Unknown error' } })}\n\n`))
          close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders() })
  } catch (err) {
    console.error('Analyze Error:', err)
    return ApiResponse.internalError('분석 중 오류가 발생했습니다')
  }
}

function sseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }
}
