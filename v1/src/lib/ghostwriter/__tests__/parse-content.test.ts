import { describe, it, expect } from 'vitest'
import { safeParseContent, extractSummary } from '../parse-content'

describe('safeParseContent', () => {
  it('정상 JSON → 모든 필드 파싱', () => {
    const input = JSON.stringify({
      summary: '이번 주 요약',
      tasks: [
        { text: 'API 연동', done: true, member: '김철수' },
        { text: '디자인 수정', done: false },
      ],
      nextPlan: '다음 주 계획',
      teamStatus: 'good',
      teamStatusReason: '순조로움',
      confidence: { summary: 'high', tasks: 'mid', nextPlan: 'low', teamStatus: 'high' },
    })

    const result = safeParseContent(input)
    expect(result.summary).toBe('이번 주 요약')
    expect(result.tasks).toHaveLength(2)
    expect(result.tasks[0].done).toBe(true)
    expect(result.tasks[0].member).toBe('김철수')
    expect(result.teamStatus).toBe('good')
    expect(result.confidence.summary).toBe('high')
  })

  it('잘못된 JSON → fallback (summary = 원문)', () => {
    const result = safeParseContent('이건 JSON이 아닙니다')
    expect(result.summary).toBe('이건 JSON이 아닙니다')
    expect(result.tasks).toEqual([])
    expect(result.teamStatus).toBe('normal')
    expect(result.confidence.summary).toBe('low')
  })

  it('빈 문자열 → fallback', () => {
    const result = safeParseContent('')
    expect(result.summary).toBe('')
    expect(result.tasks).toEqual([])
  })

  it('snake_case 필드 호환 (next_plan, team_status)', () => {
    const input = JSON.stringify({
      summary: '요약',
      tasks: [],
      next_plan: '다음 계획',
      team_status: 'hard',
      team_status_reason: '어려움',
      confidence: { summary: 'mid', tasks: 'mid', next_plan: 'mid', team_status: 'mid' },
    })

    const result = safeParseContent(input)
    expect(result.nextPlan).toBe('다음 계획')
    expect(result.teamStatus).toBe('hard')
    expect(result.teamStatusReason).toBe('어려움')
  })

  it('tasks가 배열이 아닌 경우 → 빈 배열', () => {
    const input = JSON.stringify({
      summary: '요약',
      tasks: '문자열입니다',
      nextPlan: '',
      teamStatus: 'good',
    })

    const result = safeParseContent(input)
    expect(result.tasks).toEqual([])
  })

  it('tasks 항목에 text가 없는 경우 → 필터링', () => {
    const input = JSON.stringify({
      summary: '요약',
      tasks: [
        { text: '유효한 작업', done: true },
        { done: false }, // text 없음 → 제거
        { text: '또 다른 작업', done: false },
      ],
    })

    const result = safeParseContent(input)
    expect(result.tasks).toHaveLength(2)
  })

  it('잘못된 teamStatus → normal로 교정', () => {
    const input = JSON.stringify({
      summary: '요약',
      teamStatus: 'invalid_status',
    })

    const result = safeParseContent(input)
    expect(result.teamStatus).toBe('normal')
  })

  it('잘못된 confidence 값 → mid로 교정', () => {
    const input = JSON.stringify({
      summary: '요약',
      confidence: { summary: 'invalid', tasks: 123, nextPlan: null },
    })

    const result = safeParseContent(input)
    expect(result.confidence.summary).toBe('mid')
    expect(result.confidence.tasks).toBe('mid')
    expect(result.confidence.nextPlan).toBe('mid')
  })

  it('누락된 필드 → 기본값', () => {
    const input = JSON.stringify({ summary: '요약만 있음' })

    const result = safeParseContent(input)
    expect(result.summary).toBe('요약만 있음')
    expect(result.tasks).toEqual([])
    expect(result.nextPlan).toBe('')
    expect(result.teamStatus).toBe('normal')
    expect(result.teamStatusReason).toBe('')
  })
})

describe('extractSummary', () => {
  it('JSON에서 summary 추출', () => {
    const input = JSON.stringify({ summary: '이번 주 요약입니다' })
    expect(extractSummary(input)).toBe('이번 주 요약입니다')
  })

  it('500자 초과 시 잘림 + ...', () => {
    const long = 'A'.repeat(600)
    const input = JSON.stringify({ summary: long })
    const result = extractSummary(input)
    expect(result.length).toBe(503) // 500 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('JSON 아닌 경우 → 원문 앞부분', () => {
    const input = '그냥 텍스트입니다'
    expect(extractSummary(input)).toBe('그냥 텍스트입니다')
  })

  it('maxLength 커스텀', () => {
    const input = JSON.stringify({ summary: 'A'.repeat(200) })
    const result = extractSummary(input, 100)
    expect(result.length).toBe(103) // 100 + '...'
  })
})
