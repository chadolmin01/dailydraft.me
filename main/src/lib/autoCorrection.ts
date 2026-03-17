// 자동 수정 제안 시스템
// GPT 말투, 추상적 형용사 등을 자연스러운 표현으로 변환

export interface CorrectionSuggestion {
  original: string
  suggested: string
  reason: string
  confidence: number // 0-1
}

export interface TextCorrection {
  startIndex: number
  endIndex: number
  original: string
  suggested: string
  reason: string
  applied: boolean
}

// GPT 말투 → 자연스러운 표현
const GPT_TONE_CORRECTIONS: Record<string, { replacement: string; reason: string }> = {
  '~할 수 있습니다': {
    replacement: '~합니다',
    reason: '더 직접적이고 자신감 있는 표현',
  },
  '~것입니다': {
    replacement: '~입니다',
    reason: '간결한 종결 어미',
  },
  '~하겠습니다': {
    replacement: '~합니다',
    reason: '확정적인 표현으로 변경',
  },
  '~됩니다': {
    replacement: '~합니다',
    reason: '능동형으로 변경',
  },
  '다양한': {
    replacement: '여러',
    reason: '구체적 숫자로 대체 권장',
  },
  '효과적으로': {
    replacement: '',
    reason: '수치로 대체 권장 (예: 30% 향상)',
  },
  '효율적으로': {
    replacement: '',
    reason: '수치로 대체 권장 (예: 시간 50% 단축)',
  },
  '중요합니다': {
    replacement: '핵심입니다',
    reason: '더 강한 표현',
  },
  '필요합니다': {
    replacement: '필수적입니다',
    reason: '더 강조된 표현',
  },
}

// 추상적 형용사 → 수치 기반 표현 예시
const ADJECTIVE_TO_NUMBER_EXAMPLES: Record<string, string[]> = {
  '혁신적인': [
    '처리 속도 3배 향상된',
    '기존 대비 50% 비용 절감하는',
    '특허 등록된',
  ],
  '획기적인': [
    '업계 최초로 도입된',
    '평균 대비 2배 빠른',
    '전례 없는 방식의',
  ],
  '최고의': [
    '시장 점유율 1위인',
    '고객 만족도 4.8/5.0의',
    '업계 평균 대비 상위 10%인',
  ],
  '매우': [
    '(구체적 수치로 대체)',
    '(예: 70% 이상, 2배 이상)',
  ],
  '굉장히': [
    '(구체적 수치로 대체)',
    '(예: 업계 평균의 3배)',
  ],
  '엄청난': [
    '(구체적 규모로 대체)',
    '(예: 1조원 규모의)',
  ],
  '뛰어난': [
    '업계 상위 5%의',
    '평균 대비 1.5배 높은',
  ],
}

// 문장 종결 어미 자연스럽게 변경
export function correctGptTone(text: string): TextCorrection[] {
  const corrections: TextCorrection[] = []

  for (const [pattern, { replacement, reason }] of Object.entries(GPT_TONE_CORRECTIONS)) {
    let searchIndex = 0
    while (true) {
      const index = text.indexOf(pattern, searchIndex)
      if (index === -1) break

      corrections.push({
        startIndex: index,
        endIndex: index + pattern.length,
        original: pattern,
        suggested: replacement || `[${reason}]`,
        reason,
        applied: false,
      })

      searchIndex = index + pattern.length
    }
  }

  return corrections
}

// 형용사를 수치 기반 표현으로 변경 제안
export function suggestNumberBasedExpression(
  text: string
): CorrectionSuggestion[] {
  const suggestions: CorrectionSuggestion[] = []

  for (const [adjective, examples] of Object.entries(ADJECTIVE_TO_NUMBER_EXAMPLES)) {
    if (text.includes(adjective)) {
      suggestions.push({
        original: adjective,
        suggested: examples[0],
        reason: `"${adjective}"은(는) 추상적입니다. 구체적 수치로 대체하세요.`,
        confidence: 0.9,
      })
    }
  }

  return suggestions
}

// 출처 추가 가이드
export function getSuggestedSources(topic: string): string[] {
  const topicLower = topic.toLowerCase()

  const sources: string[] = []

  if (topicLower.includes('시장') || topicLower.includes('규모')) {
    sources.push(
      'Statista (https://statista.com)',
      '한국IDC',
      '과학기술정보통신부 통계',
      '산업연구원 (KIET)',
    )
  }

  if (topicLower.includes('인구') || topicLower.includes('통계')) {
    sources.push(
      '통계청 (https://kostat.go.kr)',
      '행정안전부 주민등록 인구통계',
    )
  }

  if (topicLower.includes('창업') || topicLower.includes('스타트업')) {
    sources.push(
      '중소벤처기업부 통계',
      '창업진흥원 창업기업동향',
      'KVCA 벤처투자 동향',
    )
  }

  if (topicLower.includes('소비자') || topicLower.includes('고객')) {
    sources.push(
      '한국소비자원 조사',
      '대한상공회의소 소비자동향',
      '자체 설문조사 (응답자 N명 명시)',
    )
  }

  if (sources.length === 0) {
    sources.push(
      '관련 학술 논문',
      '정부 공식 통계',
      '자체 조사 (방법론 및 표본 명시)',
    )
  }

  return sources
}

// 전체 텍스트 자동 수정 적용
export function applyAutoCorrections(
  text: string,
  corrections: TextCorrection[]
): string {
  // Sort by index (descending) to avoid index shifting issues
  const sorted = [...corrections].sort((a, b) => b.startIndex - a.startIndex)

  let result = text
  for (const correction of sorted) {
    if (correction.suggested && !correction.suggested.startsWith('[')) {
      result =
        result.substring(0, correction.startIndex) +
        correction.suggested +
        result.substring(correction.endIndex)
    }
  }

  return result
}

// 문장 길이 최적화
export function suggestSentenceSplit(text: string): CorrectionSuggestion[] {
  const suggestions: CorrectionSuggestion[] = []
  const sentences = text.split(/(?<=[.。!?])\s*/)

  for (const sentence of sentences) {
    if (sentence.length > 80) {
      // Find good split points
      const splitPoints = [
        sentence.indexOf(', '),
        sentence.indexOf(' 그리고 '),
        sentence.indexOf(' 또한 '),
        sentence.indexOf(' 하지만 '),
      ].filter(i => i > 20 && i < sentence.length - 20)

      if (splitPoints.length > 0) {
        const splitPoint = splitPoints[0]
        const firstPart = sentence.substring(0, splitPoint).trim()
        const secondPart = sentence.substring(splitPoint + 2).trim()

        suggestions.push({
          original: sentence,
          suggested: `${firstPart}. ${secondPart.charAt(0).toUpperCase()}${secondPart.slice(1)}`,
          reason: '문장이 80자를 초과합니다. 두 문장으로 나누면 가독성이 향상됩니다.',
          confidence: 0.7,
        })
      }
    }
  }

  return suggestions
}

// 두괄식 구조 제안
export function suggestTopicSentence(paragraph: string): CorrectionSuggestion | null {
  const sentences = paragraph.split(/(?<=[.。!?])\s*/).filter(s => s.length > 0)

  if (sentences.length < 2) return null

  const firstSentence = sentences[0]
  const lastSentence = sentences[sentences.length - 1]

  // Check if the conclusion might be at the end
  const conclusionKeywords = ['따라서', '결론적으로', '즉', '결과적으로', '이를 통해']
  const hasEndConclusion = conclusionKeywords.some(k => lastSentence.includes(k))
  const hasStartConclusion = conclusionKeywords.some(k => firstSentence.includes(k))

  if (hasEndConclusion && !hasStartConclusion) {
    return {
      original: paragraph,
      suggested: `${lastSentence} ${sentences.slice(0, -1).join(' ')}`,
      reason: '두괄식 구조: 결론을 맨 앞으로 이동하면 심사위원이 핵심을 빠르게 파악할 수 있습니다.',
      confidence: 0.6,
    }
  }

  return null
}

// 전체 텍스트 분석 및 수정 제안
export interface FullAnalysisResult {
  gptToneCorrections: TextCorrection[]
  numberSuggestions: CorrectionSuggestion[]
  sentenceSuggestions: CorrectionSuggestion[]
  structureSuggestion: CorrectionSuggestion | null
  overallScore: number // 0-100
}

export function analyzeAndSuggest(text: string): FullAnalysisResult {
  const gptToneCorrections = correctGptTone(text)
  const numberSuggestions = suggestNumberBasedExpression(text)
  const sentenceSuggestions = suggestSentenceSplit(text)
  const structureSuggestion = suggestTopicSentence(text)

  // Calculate overall score based on issues found
  let score = 100
  score -= gptToneCorrections.length * 3 // -3 per GPT tone issue
  score -= numberSuggestions.length * 5 // -5 per vague adjective
  score -= sentenceSuggestions.length * 2 // -2 per long sentence
  if (structureSuggestion) score -= 5 // -5 for structure issue

  return {
    gptToneCorrections,
    numberSuggestions,
    sentenceSuggestions,
    structureSuggestion,
    overallScore: Math.max(0, Math.min(100, score)),
  }
}
