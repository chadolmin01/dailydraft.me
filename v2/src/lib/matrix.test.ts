import { describe, it, expect } from 'vitest'
import { buildMatrix, parseRosterFromSheet, type ParsedDriveFile } from './matrix'

function mkFile(team: string, week: number, name = 'x.pdf'): ParsedDriveFile {
  return {
    id: `${team}-${week}`,
    name: `[FLIP1기_${week}주차]_${team}_${name}`,
    modifiedTime: '2026-05-22T10:00:00Z',
    parsed: { program: 'FLIP1기', week, team, task: name.replace(/\.\w+$/, ''), ext: 'pdf' },
  }
}

describe('buildMatrix', () => {
  it('roster 없이 파일에서 팀 추출', () => {
    const m = buildMatrix({
      parsedFiles: [mkFile('1팀', 1), mkFile('2팀', 1), mkFile('1팀', 2)],
    })
    expect(m.teams).toEqual(['1팀', '2팀'])
    expect(m.weeks).toEqual([1, 2])
    expect(m.source.teamSource).toBe('derived')
  })

  it('roster 있으면 그쪽 우선', () => {
    const m = buildMatrix({
      parsedFiles: [mkFile('1팀', 1)],
      rosterTeams: ['1팀', '2팀', '3팀'],
    })
    expect(m.teams).toEqual(['1팀', '2팀', '3팀'])
    expect(m.source.teamSource).toBe('roster')
    expect(m.source.rosterSize).toBe(3)
  })

  it('done / empty 분기 (program_start_date 없을 때)', () => {
    const m = buildMatrix({
      parsedFiles: [mkFile('1팀', 1)],
      rosterTeams: ['1팀', '2팀'],
      weeksOverride: 2,
    })
    const c11 = m.cells.find(c => c.team === '1팀' && c.week === 1)
    const c12 = m.cells.find(c => c.team === '1팀' && c.week === 2)
    expect(c11?.status).toBe('done')
    expect(c12?.status).toBe('empty')
  })

  it('program_start_date 있으면 late / pending / empty 분기', () => {
    // 오늘이 2026-05-22 (시작일 +14일 = 3주차)
    const today = new Date('2026-05-22T00:00:00')
    const m = buildMatrix({
      parsedFiles: [mkFile('1팀', 1)],  // 1주차만 제출
      rosterTeams: ['1팀'],
      weeksOverride: 5,
      programStartDate: '2026-05-08',  // 14일 전 = 3주차 진행 중
      today,
    })
    const c1 = m.cells.find(c => c.week === 1)
    const c2 = m.cells.find(c => c.week === 2)
    const c3 = m.cells.find(c => c.week === 3)
    const c4 = m.cells.find(c => c.week === 4)
    expect(c1?.status).toBe('done')      // 제출함
    expect(c2?.status).toBe('late')      // 2주차 지났는데 안 냄
    expect(c3?.status).toBe('pending')   // 이번 주차
    expect(c4?.status).toBe('empty')     // 미래
  })

  it('팀 정렬은 숫자 기준', () => {
    const m = buildMatrix({
      parsedFiles: [mkFile('10팀', 1), mkFile('2팀', 1), mkFile('1팀', 1)],
    })
    expect(m.teams).toEqual(['1팀', '2팀', '10팀'])
  })

  it('빈 입력 — 기본 1주차', () => {
    const m = buildMatrix({ parsedFiles: [] })
    expect(m.teams).toEqual([])
    expect(m.weeks).toEqual([1])
    expect(m.cells).toEqual([])
  })
})

describe('parseRosterFromSheet', () => {
  it('첫 열만 추출', () => {
    const rows = [['팀명'], ['1팀'], ['2팀'], ['3팀']]
    expect(parseRosterFromSheet(rows)).toEqual(['1팀', '2팀', '3팀'])
  })

  it('헤더 자동 skip', () => {
    expect(parseRosterFromSheet([['팀'], ['1팀']])).toEqual(['1팀'])
    expect(parseRosterFromSheet([['#'], ['1팀']])).toEqual(['1팀'])
    expect(parseRosterFromSheet([['번호'], ['1팀']])).toEqual(['1팀'])
  })

  it('빈 셀 skip', () => {
    expect(parseRosterFromSheet([['1팀'], [''], ['2팀']])).toEqual(['1팀', '2팀'])
  })

  it('헤더 없는 시트 그대로', () => {
    expect(parseRosterFromSheet([['1팀'], ['2팀']])).toEqual(['1팀', '2팀'])
  })
})
