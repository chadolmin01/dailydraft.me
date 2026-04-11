/**
 * AI 매칭 심층 분석 — Gemini 호출 + 7일 캐시
 *
 * POST /api/users/[targetId]/ai-analysis
 *   - 현재 로그인 유저(viewer)와 targetId 사이의 협업 시너지를 LLM이 분석
 *   - (viewer_id, target_id) 쌍으로 user_match_analyses에 캐싱
 *   - 캐시 hit & 7일 이내 → 즉시 반환 (cached: true)
 *   - 캐시 miss or stale → Gemini 호출 → 저장 → 반환
 *
 * Rate limit: 분당 5회/유저 (남발 방지)
 */
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { chatModel } from '@/src/lib/ai/gemini-client'
import type { Profile } from '@/src/types/profile'

export const runtime = 'nodejs'

const CACHE_TTL_DAYS = 7
// 프롬프트 포맷 버전. 프롬프트 바뀌면 bump → 기존 캐시 무효화
const PROMPT_VERSION = 'v3'
const MODEL_TAG = `gemini-2.5-flash-lite:${PROMPT_VERSION}`
const PROFILE_FIELDS =
  'user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, locations'

interface MatchAnalysis {
  synergy: string          // 3~5 문장 시너지 분석
  strengths: string[]      // 강점 3개
  caution: string          // 유의점 1개
}

export const POST = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ targetId: string }> },
) => {
    const { targetId } = await params
    if (!targetId || typeof targetId !== 'string') {
      return ApiResponse.badRequest('잘못된 targetId')
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    if (user.id === targetId) {
      return ApiResponse.badRequest('본인 프로필은 분석할 수 없습니다')
    }

    // 1) 캐시 조회
    const { data: cached } = await supabase
      .from('user_match_analyses' as never)
      .select('analysis, created_at, model')
      .eq('viewer_id', user.id)
      .eq('target_id', targetId)
      .maybeSingle()

    const cachedRow = cached as { analysis: unknown; created_at: string; model: string } | null
    if (cachedRow) {
      const age = Date.now() - new Date(cachedRow.created_at).getTime()
      const fresh = age < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
      const sameVersion = cachedRow.model === MODEL_TAG
      if (fresh && sameVersion) {
        return ApiResponse.ok({
          analysis: cachedRow.analysis as MatchAnalysis,
          cached: true,
          created_at: cachedRow.created_at,
        })
      }
    }

    // 2) 두 유저 프로필 fetch
    const [{ data: viewerProfile }, { data: targetProfile }] = await Promise.all([
      supabase.from('profiles').select(PROFILE_FIELDS).eq('user_id', user.id).single(),
      supabase.from('profiles').select(PROFILE_FIELDS).eq('user_id', targetId).single(),
    ])

    if (!viewerProfile || !targetProfile) {
      return ApiResponse.notFound('프로필을 찾을 수 없습니다')
    }

    // 3) Gemini 호출
    const analysis = await generateAnalysis(
      viewerProfile as unknown as Profile,
      targetProfile as unknown as Profile,
    )

    // 4) 캐시 저장 (upsert)
    await supabase
      .from('user_match_analyses' as never)
      .upsert(
        {
          viewer_id: user.id,
          target_id: targetId,
          analysis: analysis as unknown as Record<string, unknown>,
          model: MODEL_TAG,
          created_at: new Date().toISOString(),
        } as never,
        { onConflict: 'viewer_id,target_id' },
      )

    return ApiResponse.ok({
      analysis,
      cached: false,
      created_at: new Date().toISOString(),
    })
})

async function generateAnalysis(viewer: Profile, target: Profile): Promise<MatchAnalysis> {
  const prompt = buildPrompt(viewer, target)
  const result = await chatModel.generateContent(prompt)
  const text = result.response?.text?.() || ''

  // JSON 추출 (LLM이 마크다운 코드블록으로 감싸는 경우 대비)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답에서 JSON 파싱 실패')

  const parsed = JSON.parse(match[0])
  if (
    typeof parsed.synergy !== 'string' ||
    !Array.isArray(parsed.strengths) ||
    typeof parsed.caution !== 'string'
  ) {
    throw new Error('AI 응답 스키마 불일치')
  }

  return {
    synergy: String(parsed.synergy).trim(),
    strengths: parsed.strengths.slice(0, 3).map((s: unknown) => String(s).trim()),
    caution: String(parsed.caution).trim(),
  }
}

function buildPrompt(viewer: Profile, target: Profile): string {
  const fmt = (p: Profile) => ({
    포지션: p.desired_position || '미지정',
    스킬: (p.skills || []).map((s) => s.name).join(', ') || '없음',
    관심사: (p.interest_tags || []).join(', ') || '없음',
    성향: p.personality || {},
    현재상황: p.current_situation || '미지정',
    지역: (p.locations as string[] | null)?.join(', ') || '미지정',
    비전: p.vision_summary || '없음',
  })

  const targetName = target.nickname || '상대방'

  return `당신은 스타트업 팀 매칭을 평가하는 **냉정한** 전문가입니다. 립서비스 금지. 두 프로필을 보고 실제 협업 시 어떨지 솔직하게 분석하세요.

**나의 프로필**
${JSON.stringify(fmt(viewer), null, 2)}

**${targetName}님의 프로필**
${JSON.stringify(fmt(target), null, 2)}

분석 원칙 (매우 중요):
1. **긍정 편향 금지**. "좋은 팀이 될 거예요", "시너지가 기대돼요" 같은 공허한 칭찬 금지.
2. 스킬이 겹치면 "역할 충돌 가능성", 관심사가 다르면 "동기 어긋남", 성향이 비슷하면 "약점 보완 어려움"처럼 **실제 리스크를 짚으세요**.
3. 프로필 정보가 부족하면 "정보가 부족해서 단정하긴 어려워요"라고 솔직히 쓰세요. 없는 내용을 추측하지 마세요.
4. 매칭이 애매하거나 별로면 그렇게 말하세요. 100점짜리 팀은 드뭅니다.
5. caution은 **반드시 구체적 리스크 하나**. "없음"이나 "협업 팁"으로 회피 금지.

표현 규칙:
- 독자는 "나". "나"/"당신" 쓰지 말고, 상대는 "${targetName}님"으로만 지칭.
- "viewer"/"target"/"사용자1" 같은 기술 용어 금지.
- 친근한 존댓말 ("~이에요", "~해요"). 과장된 감탄사("정말!", "완벽!") 금지.
- 구체적 스킬명·관심사·성향 근거를 문장에 녹여서 쓰세요.

다음 JSON 형식으로만 응답. 다른 텍스트 금지.
{
  "synergy": "3~5문장. 긍정만이 아니라 현실적인 그림. 예: \\"${targetName}님은 X를 다루시지만, 내 Y와는 직접 겹치지 않아서 역할 분담은 명확할 거예요. 다만 둘 다 Z 성향이라 ...\\"",
  "strengths": ["실제 강점 1 (짧고 구체적)", "강점 2", "강점 3 — 강점이 2개뿐이면 세 번째는 빈 문자열 대신 '추가 강점 찾기 어려움' 처럼 솔직하게"],
  "caution": "구체적인 리스크/마찰 포인트 한 문장. 예: '둘 다 리더 성향이라 의사결정에서 충돌 가능' 또는 '관심사 겹침이 적어 프로젝트 방향 합의부터 필요'. 반드시 써주세요."
}`
}
