/**
 * Ghostwriter 초안 JSON → 읽기 좋은 마크다운 변환.
 *
 * project_updates 테이블에는 사람이 바로 읽을 수 있는 텍스트가 들어가야 한다.
 * 승인 시 JSON 원문 대신 이 함수의 결과를 저장한다.
 */

import { safeParseContent, type ParsedContent } from './parse-content'

const STATUS_LABEL: Record<ParsedContent['teamStatus'], string> = {
  good: '순조로움',
  normal: '보통',
  hard: '어려움',
}

/**
 * ParsedContent → 가독성 있는 여러줄 텍스트.
 * - summary: 본문 도입
 * - tasks: ✓ / · 로 완료 상태 표시
 * - nextPlan: 다음 주 계획 섹션
 * - teamStatus: 팀 상태 라벨 + 근거
 */
export function formatParsedContent(p: ParsedContent): string {
  const parts: string[] = []

  if (p.summary?.trim()) {
    parts.push(p.summary.trim())
  }

  if (p.tasks.length > 0) {
    const lines = p.tasks.map(t => {
      const mark = t.done ? '✓' : '·'
      const member = t.member ? ` (${t.member})` : ''
      return `${mark} ${t.text}${member}`
    })
    parts.push(`이번 주 작업\n${lines.join('\n')}`)
  }

  if (p.nextPlan?.trim()) {
    parts.push(`다음 주 계획\n${p.nextPlan.trim()}`)
  }

  if (p.teamStatus) {
    const statusLine = `팀 상태 · ${STATUS_LABEL[p.teamStatus] ?? p.teamStatus}`
    if (p.teamStatusReason?.trim()) {
      parts.push(`${statusLine}\n${p.teamStatusReason.trim()}`)
    } else {
      parts.push(statusLine)
    }
  }

  return parts.join('\n\n').trim()
}

/**
 * content 가 JSON 이면 마크다운으로 변환, 아니면 원문 그대로 반환.
 * 기존 수동 업데이트(텍스트)와 Ghostwriter 승인 경로 모두에서 안전하게 사용 가능.
 */
export function toReadableContent(content: string): string {
  if (!content || content.trim().length === 0) return ''
  const trimmed = content.trim()
  // JSON 문자열로 보이면 파싱해서 포맷
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = safeParseContent(trimmed)
      const formatted = formatParsedContent(parsed)
      if (formatted) return formatted
    } catch {
      // fallthrough
    }
  }
  return content
}
