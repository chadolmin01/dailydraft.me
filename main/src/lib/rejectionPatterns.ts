// 탈락 패턴 감지 시스템
// 정부지원사업 심사위원이 자주 지적하는 패턴들을 실시간으로 감지

export interface RejectionPattern {
  id: string
  name: string
  description: string
  severity: 'high' | 'medium' | 'low'
  category: 'tone' | 'content' | 'structure' | 'data'
  check: (text: string, context?: RejectionCheckContext) => RejectionMatch | null
  feedback: string
  autoFixable: boolean
  autoFixSuggestion?: (matched: RejectionMatch) => string
}

export interface RejectionMatch {
  patternId: string
  matches: string[]
  positions: Array<{ start: number; end: number; text: string }>
  count: number
  severity: 'high' | 'medium' | 'low'
}

export interface RejectionCheckContext {
  section?: string
  hasNumbers?: boolean
  totalLength?: number
}

export interface RejectionWarning {
  pattern: RejectionPattern
  match: RejectionMatch
  autoFixAvailable: boolean
  suggestedFix?: string
}

// GPT 말투 패턴 (심사위원이 AI 작성으로 의심)
const GPT_TONE_PATTERNS = [
  '~할 수 있습니다',
  '~것입니다',
  '~하겠습니다',
  '~됩니다',
  '다양한',
  '효과적으로',
  '효율적으로',
  '중요합니다',
  '필요합니다',
]

// 추상적 형용사 (구체성 부족)
const VAGUE_ADJECTIVES = [
  '혁신적인',
  '획기적인',
  '최고의',
  '최초의',
  '매우',
  '굉장히',
  '엄청난',
  '놀라운',
  '뛰어난',
  '독보적인',
  '압도적인',
]

// 근거 없는 주장 패턴
const UNSUPPORTED_CLAIMS = [
  '국내 최초',
  '세계 최초',
  '업계 최초',
  '유일한',
  '독점적',
  '압도적 1위',
]

// 출처 표기 패턴 (긍정)
const SOURCE_PATTERNS = [
  /\(.*\d{4}.*\)/,  // (출처, 2024)
  /출처[:：]/,
  /자료[:：]/,
  /※.*출처/,
  /통계청/,
  /연구원/,
  /보고서/,
  /Statista/i,
  /IDC/,
  /Gartner/i,
]

export const REJECTION_PATTERNS: RejectionPattern[] = [
  {
    id: 'GPT_TONE',
    name: 'GPT 말투 감지',
    description: '심사위원이 AI 작성으로 의심할 수 있는 표현',
    severity: 'high',
    category: 'tone',
    check: (text) => {
      const matches: string[] = []
      const positions: Array<{ start: number; end: number; text: string }> = []

      for (const pattern of GPT_TONE_PATTERNS) {
        let index = 0
        while ((index = text.indexOf(pattern, index)) !== -1) {
          // Get the full sentence containing the pattern
          const sentenceStart = Math.max(0, text.lastIndexOf('。', index) + 1, text.lastIndexOf('.', index) + 1, text.lastIndexOf('\n', index) + 1)
          const sentenceEnd = Math.min(text.length,
            text.indexOf('。', index + pattern.length) !== -1 ? text.indexOf('。', index + pattern.length) : text.length,
            text.indexOf('.', index + pattern.length) !== -1 ? text.indexOf('.', index + pattern.length) : text.length,
            text.indexOf('\n', index + pattern.length) !== -1 ? text.indexOf('\n', index + pattern.length) : text.length
          )

          const matchedText = text.substring(sentenceStart, sentenceEnd).trim()
          if (matchedText && !matches.includes(matchedText)) {
            matches.push(pattern)
            positions.push({ start: index, end: index + pattern.length, text: matchedText })
          }
          index += pattern.length
        }
      }

      if (matches.length >= 2) {
        return {
          patternId: 'GPT_TONE',
          matches,
          positions,
          count: matches.length,
          severity: matches.length >= 4 ? 'high' : 'medium',
        }
      }
      return null
    },
    feedback: '심사위원이 AI 작성으로 의심할 수 있는 표현입니다. 더 자연스러운 표현으로 수정해주세요.',
    autoFixable: true,
    autoFixSuggestion: (match) => {
      const fixes: Record<string, string> = {
        '~할 수 있습니다': '~합니다',
        '~것입니다': '~입니다',
        '~하겠습니다': '~합니다',
        '다양한': '여러',
        '효과적으로': '실제로',
        '효율적으로': '빠르게',
        '중요합니다': '핵심입니다',
        '필요합니다': '요구됩니다',
      }
      return match.matches.map(m => `"${m}" → "${fixes[m] || m}"`).join(', ')
    },
  },
  {
    id: 'VAGUE_ADJECTIVES',
    name: '추상적 형용사',
    description: '구체적 수치로 대체해야 하는 모호한 표현',
    severity: 'medium',
    category: 'content',
    check: (text) => {
      const matches: string[] = []
      const positions: Array<{ start: number; end: number; text: string }> = []

      for (const adj of VAGUE_ADJECTIVES) {
        let index = 0
        while ((index = text.indexOf(adj, index)) !== -1) {
          matches.push(adj)
          positions.push({ start: index, end: index + adj.length, text: adj })
          index += adj.length
        }
      }

      if (matches.length >= 1) {
        return {
          patternId: 'VAGUE_ADJECTIVES',
          matches: [...new Set(matches)],
          positions,
          count: matches.length,
          severity: matches.length >= 3 ? 'high' : 'medium',
        }
      }
      return null
    },
    feedback: '구체적 수치로 대체하세요. "혁신적인" → "처리 속도 3배 향상된"',
    autoFixable: true,
    autoFixSuggestion: () => {
      return '예시: "혁신적인 기술" → "처리 속도 3배 향상된 기술", "매우 큰 시장" → "연 1조원 규모의 시장"'
    },
  },
  {
    id: 'NO_NUMBERS',
    name: '수치 부족',
    description: '정량적 데이터가 부족한 섹션',
    severity: 'high',
    category: 'data',
    check: (text, context) => {
      const numberMatches = text.match(/\d+(\.\d+)?(%|명|원|억|조|만|개|년|월|일|배|시간)?/g)
      const numberCount = numberMatches?.length || 0
      const textLength = text.length

      // Expect at least 1 number per 200 characters for data-heavy sections
      const expectedNumbers = Math.max(3, Math.floor(textLength / 200))

      if (numberCount < expectedNumbers && textLength > 100) {
        return {
          patternId: 'NO_NUMBERS',
          matches: [],
          positions: [],
          count: 0,
          severity: numberCount === 0 ? 'high' : 'medium',
        }
      }
      return null
    },
    feedback: '정량적 데이터가 부족합니다. 시장 규모, 성장률, 고객 수 등 구체적 숫자를 추가하세요.',
    autoFixable: false,
  },
  {
    id: 'MISSING_SOURCE',
    name: '출처 누락',
    description: '데이터에 출처가 없음',
    severity: 'high',
    category: 'data',
    check: (text) => {
      // Check if there are numbers but no sources
      const hasNumbers = /\d+(\.\d+)?(%|명|원|억|조|만)?/.test(text)
      const hasSource = SOURCE_PATTERNS.some(p => p.test(text))

      if (hasNumbers && !hasSource && text.length > 200) {
        return {
          patternId: 'MISSING_SOURCE',
          matches: ['출처 없음'],
          positions: [],
          count: 1,
          severity: 'high',
        }
      }
      return null
    },
    feedback: '데이터 출처를 명시하세요. 예: (통계청, 2024) 또는 (자체 설문조사 N명)',
    autoFixable: false,
  },
  {
    id: 'UNSUPPORTED_CLAIM',
    name: '근거 없는 주장',
    description: '증거 없이 "최초", "유일" 등을 주장',
    severity: 'high',
    category: 'content',
    check: (text) => {
      const matches: string[] = []
      const positions: Array<{ start: number; end: number; text: string }> = []

      for (const claim of UNSUPPORTED_CLAIMS) {
        let index = 0
        while ((index = text.indexOf(claim, index)) !== -1) {
          // Check if there's a source nearby (within 100 chars)
          const nearbyText = text.substring(Math.max(0, index - 50), Math.min(text.length, index + claim.length + 50))
          const hasNearbySource = SOURCE_PATTERNS.some(p => p.test(nearbyText))

          if (!hasNearbySource) {
            matches.push(claim)
            positions.push({ start: index, end: index + claim.length, text: claim })
          }
          index += claim.length
        }
      }

      if (matches.length > 0) {
        return {
          patternId: 'UNSUPPORTED_CLAIM',
          matches: [...new Set(matches)],
          positions,
          count: matches.length,
          severity: 'high',
        }
      }
      return null
    },
    feedback: '"최초", "유일" 등의 주장에는 반드시 근거나 출처를 명시하세요.',
    autoFixable: false,
  },
  {
    id: 'WEAK_TEAM_DESCRIPTION',
    name: '팀 역량 부족',
    description: '팀원의 관련 경력이 구체적이지 않음',
    severity: 'medium',
    category: 'content',
    check: (text, context) => {
      if (context?.section !== 'team') return null

      const hasSpecificYears = /\d+년/.test(text)
      const hasCompanyNames = /(출신|근무|재직|전\s)/.test(text)
      const hasRoles = /(대표|CEO|CTO|CMO|개발|마케팅|기획)/.test(text)

      if (text.length > 100 && (!hasSpecificYears || !hasCompanyNames)) {
        return {
          patternId: 'WEAK_TEAM_DESCRIPTION',
          matches: ['경력 불명확'],
          positions: [],
          count: 1,
          severity: 'medium',
        }
      }
      return null
    },
    feedback: '관련 분야 경력을 구체적으로 명시하세요. 예: "네이버 출신 개발자 5년 경력"',
    autoFixable: false,
  },
  {
    id: 'LONG_SENTENCES',
    name: '문장 과다',
    description: '문장이 너무 길어 가독성 저하',
    severity: 'low',
    category: 'structure',
    check: (text) => {
      const sentences = text.split(/[.。!?]/).filter(s => s.trim().length > 0)
      const longSentences = sentences.filter(s => s.length > 80)

      if (longSentences.length >= 3) {
        return {
          patternId: 'LONG_SENTENCES',
          matches: longSentences.slice(0, 3).map(s => s.substring(0, 50) + '...'),
          positions: [],
          count: longSentences.length,
          severity: 'low',
        }
      }
      return null
    },
    feedback: '문장을 40자 이내로 간결하게 작성하세요. 긴 문장은 2개로 나누세요.',
    autoFixable: false,
  },
  {
    id: 'NO_STRUCTURE',
    name: '구조화 부족',
    description: '불릿포인트나 번호 없이 장문으로 작성',
    severity: 'low',
    category: 'structure',
    check: (text) => {
      const hasBullets = /[•\-\*]/.test(text) || /^\d+\./.test(text)
      const hasHeadings = /^#+\s|^###/.test(text)
      const isLongText = text.length > 500

      if (isLongText && !hasBullets && !hasHeadings) {
        return {
          patternId: 'NO_STRUCTURE',
          matches: ['구조화 필요'],
          positions: [],
          count: 1,
          severity: 'low',
        }
      }
      return null
    },
    feedback: '핵심 내용을 불릿포인트(•)나 번호로 구조화하세요. 심사위원이 빠르게 파악할 수 있습니다.',
    autoFixable: false,
  },
]

// Check all patterns against text
export function checkRejectionPatterns(
  text: string,
  context?: RejectionCheckContext
): RejectionWarning[] {
  const warnings: RejectionWarning[] = []

  for (const pattern of REJECTION_PATTERNS) {
    const match = pattern.check(text, context)
    if (match) {
      warnings.push({
        pattern,
        match,
        autoFixAvailable: pattern.autoFixable,
        suggestedFix: pattern.autoFixable && pattern.autoFixSuggestion
          ? pattern.autoFixSuggestion(match)
          : undefined,
      })
    }
  }

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 }
  warnings.sort((a, b) => severityOrder[a.match.severity] - severityOrder[b.match.severity])

  return warnings
}

// Get all warnings for full business plan
export function checkAllSections(
  sectionData: Record<string, Record<string, string>>
): Record<string, RejectionWarning[]> {
  const result: Record<string, RejectionWarning[]> = {}

  for (const [section, data] of Object.entries(sectionData)) {
    const text = Object.values(data).join('\n')
    result[section] = checkRejectionPatterns(text, { section })
  }

  return result
}

// Count total warnings by severity
export function countWarningsBySeverity(
  warnings: RejectionWarning[]
): { high: number; medium: number; low: number; total: number } {
  const counts = { high: 0, medium: 0, low: 0, total: warnings.length }

  for (const warning of warnings) {
    counts[warning.match.severity]++
  }

  return counts
}
