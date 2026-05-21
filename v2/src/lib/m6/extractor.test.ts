import { describe, it, expect } from 'vitest'
import { extractAtomsFromFile, findAtomByKey } from './extractor'
import type { Atom } from './types'

describe('extractAtomsFromFile (M6 v1.1)', () => {
  it('filename 에서 둘 다 추출 → Event + Entity Atom 각 1개, confidence 1.0', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f1',
      name: '[FLIP1기_3주차]_3팀_MVP.pdf',
      path: [],
    })
    expect(atoms).toHaveLength(2)
    const week = findAtomByKey(atoms, 'week:3')
    const team = findAtomByKey(atoms, 'team:3')
    expect(week?.type).toBe('Event')
    expect(week?.content).toBe('3주차')
    expect(week?.confidence).toBe(1.0)
    expect(week?.provenance.source.location).toBe('filename')
    expect(team?.type).toBe('Entity')
    expect(team?.content).toBe('3팀')
  })

  it('path 에서 추출 (전형적 폴더 구조)', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f2',
      name: 'MVP기획서.pdf',
      path: ['3주차', '3팀'],
    })
    expect(atoms).toHaveLength(2)
    const week = findAtomByKey(atoms, 'week:3')
    const team = findAtomByKey(atoms, 'team:3')
    expect(week?.provenance.source.location).toBe('path:0')
    expect(week?.confidence).toBe(0.85)
    expect(team?.provenance.source.location).toBe('path:1')
  })

  it('filename + path 동시 = confidence 1.0', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f3',
      name: '3주차_3팀_과제.pdf',
      path: ['3주차'],  // 같은 week 가 양쪽
    })
    const week = findAtomByKey(atoms, 'week:3')
    // filename 우선이지만 path 에도 같은 값이 있으므로 confidence 1.0
    expect(week?.confidence).toBe(1.0)
  })

  it('영어 표기 (Week / Team)', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f4',
      name: 'doc.pdf',
      path: ['Week 5', 'Team 2'],
    })
    expect(findAtomByKey(atoms, 'week:5')?.provenance.source.raw_text).toMatch(/Week\s*5/i)
    expect(findAtomByKey(atoms, 'team:2')?.content).toBe('2팀')
  })

  it('조 도 팀으로 normalize', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f5',
      name: 'doc.pdf',
      path: ['1주차', '3조'],
    })
    expect(findAtomByKey(atoms, 'team:3')?.content).toBe('3팀')
  })

  it('인식 실패 시 Atom 0개', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f6',
      name: 'random.pdf',
      path: ['misc'],
    })
    expect(atoms).toEqual([])
  })

  it('한 개만 (week 만 인식)', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f7',
      name: 'doc.pdf',
      path: ['3주차'],
    })
    expect(atoms).toHaveLength(1)
    expect(atoms[0].canonical_key).toBe('week:3')
  })

  it('Provenance.extracted_by 는 V1 extractor 메타', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f8',
      name: '3주차.pdf',
      path: [],
    })
    expect(atoms[0].provenance.extracted_by.model).toBe('rules-v1')
    expect(atoms[0].provenance.extracted_by.extractor_version).toBe('m6-extractor-v1.1')
    // extracted_at 은 valid ISO 8601
    expect(() => new Date(atoms[0].provenance.extracted_by.extracted_at).toISOString()).not.toThrow()
  })

  it('비정상 숫자 거부 (week > 52)', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'f9',
      name: '100주차_과제.pdf',
      path: [],
    })
    expect(findAtomByKey(atoms, 'week:100')).toBeUndefined()
  })

  it('week 결정 시 path 의 첫 매칭 사용', () => {
    const atoms = extractAtomsFromFile({
      file_id: 'fA',
      name: 'doc.pdf',
      path: ['1주차', '2주차_재제출'],
    })
    const week = findAtomByKey(atoms, 'week:1')
    expect(week?.provenance.source.location).toBe('path:0')
  })

  it('Atom id 가 file_id 기반 — 같은 파일에서 같은 type 두 번 없음', () => {
    const atoms: Atom[] = extractAtomsFromFile({
      file_id: 'fB',
      name: '3주차_3팀.pdf',
      path: ['5주차'],  // filename 우선
    })
    const ids = atoms.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
