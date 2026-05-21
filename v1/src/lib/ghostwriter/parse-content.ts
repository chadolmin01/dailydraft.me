/**
 * Ghostwriter 초안 content(JSON 문자열) 안전 파서.
 *
 * - 서버(notify.ts, route.ts)와 클라이언트(DraftReviewClient)가 공유
 * - JSON.parse 실패 시 fallback 구조를 반환 (raw JSON 노출 방지)
 * - 필드 누락/타입 불일치를 방어적으로 처리
 */

export interface ParsedContent {
  summary: string
  tasks: { text: string; done: boolean; source?: string; member?: string }[]
  nextPlan: string
  teamStatus: 'good' | 'normal' | 'hard'
  teamStatusReason: string
  confidence: {
    summary: 'high' | 'mid' | 'low'
    tasks: 'high' | 'mid' | 'low'
    nextPlan: 'high' | 'mid' | 'low'
    teamStatus: 'high' | 'mid' | 'low'
  }
}

const VALID_STATUSES = ['good', 'normal', 'hard'] as const
const VALID_CONFIDENCE = ['high', 'mid', 'low'] as const

function isValidConfidence(v: unknown): v is 'high' | 'mid' | 'low' {
  return typeof v === 'string' && (VALID_CONFIDENCE as readonly string[]).includes(v)
}

/**
 * content 문자열을 ParsedContent로 안전하게 파싱한다.
 * - JSON 파싱 실패 → 원문을 summary로 넣은 fallback 반환
 * - 필드 누락 → 기본값으로 채움
 * - 배열이 아닌 tasks → 빈 배열로 교체
 */
export function safeParseContent(content: string): ParsedContent {
  const fallback: ParsedContent = {
    summary: content.slice(0, 1000),
    tasks: [],
    nextPlan: '',
    teamStatus: 'normal',
    teamStatusReason: '',
    confidence: { summary: 'low', tasks: 'low', nextPlan: 'low', teamStatus: 'low' },
  }

  if (!content || content.trim().length === 0) return fallback

  try {
    const raw = JSON.parse(content)
    if (typeof raw !== 'object' || raw === null) return fallback

    // snake_case 호환 (next_plan → nextPlan)
    const nextPlan = raw.nextPlan ?? raw.next_plan ?? ''
    const teamStatus = raw.teamStatus ?? raw.team_status ?? 'normal'
    const teamStatusReason = raw.teamStatusReason ?? raw.team_status_reason ?? ''

    // tasks 배열 검증 — 각 항목이 {text, done} 최소 구조를 가져야 함
    let tasks: ParsedContent['tasks'] = []
    if (Array.isArray(raw.tasks)) {
      tasks = raw.tasks
        .filter((t: unknown) => typeof t === 'object' && t !== null && 'text' in t)
        .map((t: { text: unknown; done: unknown; source?: unknown; member?: unknown }) => ({
          text: String(t.text),
          done: Boolean(t.done),
          ...(t.source ? { source: String(t.source) } : {}),
          ...(t.member ? { member: String(t.member) } : {}),
        }))
    }

    // confidence 객체 검증
    const rawConf = raw.confidence
    const confidence: ParsedContent['confidence'] = {
      summary: isValidConfidence(rawConf?.summary) ? rawConf.summary : 'mid',
      tasks: isValidConfidence(rawConf?.tasks) ? rawConf.tasks : 'mid',
      nextPlan: isValidConfidence(rawConf?.nextPlan ?? rawConf?.next_plan) ? (rawConf.nextPlan ?? rawConf.next_plan) : 'mid',
      teamStatus: isValidConfidence(rawConf?.teamStatus ?? rawConf?.team_status) ? (rawConf.teamStatus ?? rawConf.team_status) : 'mid',
    }

    return {
      summary: typeof raw.summary === 'string' ? raw.summary : String(raw.summary ?? ''),
      tasks,
      nextPlan: typeof nextPlan === 'string' ? nextPlan : '',
      teamStatus: (VALID_STATUSES as readonly string[]).includes(teamStatus) ? teamStatus : 'normal',
      teamStatusReason: typeof teamStatusReason === 'string' ? teamStatusReason : '',
      confidence,
    }
  } catch {
    return fallback
  }
}

/** summary만 추출 (알림용). 파싱 실패 시 원문 앞부분 반환. */
export function extractSummary(content: string, maxLength = 500): string {
  const parsed = safeParseContent(content)
  const summary = parsed.summary
  return summary.length > maxLength
    ? summary.slice(0, maxLength) + '...'
    : summary
}
