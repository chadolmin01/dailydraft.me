import { describe, it, expect } from 'vitest'
import { buildMatrix, parseRosterFromSheet, type FileWithAtoms } from './matrix'
import type { Atom } from './m6/types'
import { v1ExtractedBy } from './m6/types'

function mkAtom(type: 'Event' | 'Entity', content: string, key: string, location = 'filename', confidence = 1.0): Atom {
  return {
    id: `${key}-${Math.random()}`,
    type,
    content,
    confidence,
    canonical_key: key,
    provenance: {
      source: { file_id: 'f', location, raw_text: content },
      extracted_by: v1ExtractedBy(),
    },
  }
}

function mkFile(team: string | null, week: number | null, opts: { path?: string[]; location?: string } = {}): FileWithAtoms {
  const atoms: Atom[] = []
  const loc = opts.location ?? 'filename'
  if (week !== null) atoms.push(mkAtom('Event', `${week}주차`, `week:${week}`, loc))
  if (team !== null) atoms.push(mkAtom('Entity', team, `team:${parseInt(team, 10)}`, loc))
  return {
    file_id: `f-${team}-${week}`,
    name: `file-${team}-${week}.pdf`,
    modifiedTime: '2026-05-22T10:00:00Z',
    path: opts.path ?? [],
    atoms,
  }
}

describe('buildMatrix (M6 Atom 기반)', () => {
  it('roster 없이 Atom 에서 팀 추출', () => {
    const m = buildMatrix({
      files: [mkFile('1팀', 1), mkFile('2팀', 1), mkFile('1팀', 2)],
    })
    expect(m.teams).toEqual(['1팀', '2팀'])
    expect(m.weeks).toEqual([1, 2])
    expect(m.source.teamSource).toBe('derived')
    expect(m.source.fileCount).toBe(3)
    expect(m.source.unmatchedCount).toBe(0)
  })

  it('roster 있으면 그쪽 우선', () => {
    const m = buildMatrix({
      files: [mkFile('1팀', 1)],
      rosterTeams: ['1팀', '2팀', '3팀'],
    })
    expect(m.teams).toEqual(['1팀', '2팀', '3팀'])
    expect(m.source.teamSource).toBe('roster')
    expect(m.source.rosterSize).toBe(3)
  })

  it('week 또는 team Atom 둘 중 하나 없으면 unmatched', () => {
    const m = buildMatrix({
      files: [
        mkFile('1팀', 1),
        mkFile(null, 2),
        mkFile('3팀', null),
      ],
    })
    expect(m.source.fileCount).toBe(1)
    expect(m.source.unmatchedCount).toBe(2)
    expect(m.teams).toEqual(['1팀'])
  })

  it('done / empty 분기 (program_start_date 없을 때)', () => {
    const m = buildMatrix({
      files: [mkFile('1팀', 1)],
      rosterTeams: ['1팀', '2팀'],
      weeksOverride: 2,
    })
    const c11 = m.cells.find(c => c.team === '1팀' && c.week === 1)
    const c12 = m.cells.find(c => c.team === '1팀' && c.week === 2)
    expect(c11?.status).toBe('done')
    expect(c12?.status).toBe('empty')
  })

  it('program_start_date 로 late / pending / empty 분기', () => {
    const today = new Date('2026-05-22T00:00:00')
    const m = buildMatrix({
      files: [mkFile('1팀', 1)],
      rosterTeams: ['1팀'],
      weeksOverride: 5,
      programStartDate: '2026-05-08',
      today,
    })
    expect(m.cells.find(c => c.week === 1)?.status).toBe('done')
    expect(m.cells.find(c => c.week === 2)?.status).toBe('late')
    expect(m.cells.find(c => c.week === 3)?.status).toBe('pending')
    expect(m.cells.find(c => c.week === 4)?.status).toBe('empty')
  })

  it('팀 정렬은 숫자 기준', () => {
    const m = buildMatrix({
      files: [mkFile('10팀', 1), mkFile('2팀', 1), mkFile('1팀', 1)],
    })
    expect(m.teams).toEqual(['1팀', '2팀', '10팀'])
  })

  it('빈 입력', () => {
    const m = buildMatrix({ files: [] })
    expect(m.teams).toEqual([])
    expect(m.weeks).toEqual([1])
    expect(m.cells).toEqual([])
  })

  it('cell.files 에 provenance_summary 보존', () => {
    const m = buildMatrix({
      files: [mkFile('1팀', 1, { path: ['1주차'], location: 'path:0' })],
    })
    const c = m.cells.find(c => c.team === '1팀' && c.week === 1)
    expect(c?.files[0].provenance_summary).toBe('path')
    expect(c?.files[0].path).toEqual(['1주차'])
  })

  it('mixed provenance (filename + path 양쪽)', () => {
    const file: FileWithAtoms = {
      file_id: 'fm',
      name: '5주차.pdf',
      modifiedTime: '2026-05-22T10:00:00Z',
      path: ['3팀'],
      atoms: [
        mkAtom('Event', '5주차', 'week:5', 'filename'),
        mkAtom('Entity', '3팀', 'team:3', 'path:0'),
      ],
    }
    const m = buildMatrix({ files: [file] })
    const c = m.cells.find(c => c.team === '3팀' && c.week === 5)
    expect(c?.files[0].provenance_summary).toBe('mixed')
  })
})

describe('parseRosterFromSheet', () => {
  it('첫 열만 추출', () => {
    expect(parseRosterFromSheet([['팀명'], ['1팀'], ['2팀']])).toEqual(['1팀', '2팀'])
  })
  it('헤더 자동 skip', () => {
    expect(parseRosterFromSheet([['#'], ['1팀']])).toEqual(['1팀'])
  })
  it('빈 셀 skip', () => {
    expect(parseRosterFromSheet([['1팀'], [''], ['2팀']])).toEqual(['1팀', '2팀'])
  })
})
