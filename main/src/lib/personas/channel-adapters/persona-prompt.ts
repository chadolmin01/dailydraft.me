/**
 * 페르소나 슬롯 → 프롬프트 문자열 변환 헬퍼.
 * 모든 채널 어댑터가 공통으로 사용.
 */

import type { FieldKey, ResolvedPersona } from '@/src/lib/personas/types'

/**
 * 슬롯 값을 읽기 쉬운 텍스트로 변환.
 * R1에서 { text } 또는 { items: string[] } 두 패턴으로 저장 중.
 */
function slotToText(value: Record<string, unknown> | undefined): string | null {
  if (!value) return null
  if (typeof value.text === 'string') return value.text
  if (Array.isArray(value.items)) {
    return value.items
      .map((x) => (typeof x === 'string' ? `- ${x}` : `- ${JSON.stringify(x)}`))
      .join('\n')
  }
  // 구조화된 객체 (ending_signature, hooking_style 등)는 JSON으로 그대로
  return JSON.stringify(value, null, 2)
}

/**
 * 프롬프트용 "페르소나 카드" 섹션 빌드.
 * LLM이 이걸 보고 "내가 이 조직답게 써야 한다"고 이해하도록.
 *
 * includeSlots로 필요한 슬롯만 선택 가능 (프롬프트 길이 절약).
 */
export function buildPersonaPrompt(
  persona: ResolvedPersona,
  includeSlots?: FieldKey[],
): { prompt: string; usedSlots: FieldKey[] } {
  const keys: FieldKey[] =
    includeSlots ??
    ([
      'identity',
      'audience',
      'hooking_style',
      'sentence_style',
      'ending_signature',
      'vocabulary',
      'taboos',
      'reproduction_checklist',
    ] as FieldKey[])

  const parts: string[] = []
  const used: FieldKey[] = []

  for (const key of keys) {
    const field = persona.fields[key]
    if (!field) continue
    const text = slotToText(field.value as Record<string, unknown>)
    if (!text) continue
    parts.push(`[${sectionLabel(key)}]\n${text}`)
    used.push(key)
  }

  return {
    prompt: parts.length
      ? `# 브랜드 페르소나\n${parts.join('\n\n')}`
      : '(페르소나 슬롯이 비어있음. 일반적인 합쇼체 한국어로 작성)',
    usedSlots: used,
  }
}

function sectionLabel(key: FieldKey): string {
  const labels: Record<FieldKey, string> = {
    identity: '정체성',
    audience: '독자',
    content_patterns: '인기 콘텐츠 패턴',
    hooking_style: '후킹 스타일',
    sentence_style: '문장 스타일',
    ending_signature: '어미 시그니처',
    thought_development: '논리 전개',
    emotional_distance: '감정 거리감',
    humor: '유머',
    vocabulary: '어휘 특성',
    rhythm: '리듬',
    taboos: '절대 금기',
    reproduction_checklist: '재현 체크리스트',
  }
  return labels[key]
}
