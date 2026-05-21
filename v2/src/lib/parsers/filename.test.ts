import { describe, it, expect } from 'vitest'
import { parseFilename, parseFilenames } from './filename'

describe('parseFilename', () => {
  it('CONVENTIONS.md 의 정규 형식을 파싱한다', () => {
    expect(parseFilename('[FLIP1기_3주차]_3팀_MVP기획서.pdf')).toEqual({
      program: 'FLIP1기',
      week: 3,
      team: '3팀',
      task: 'MVP기획서',
      ext: 'pdf',
    })
  })

  it('과제명에 언더스코어가 있어도 통째로 task 로 인식', () => {
    expect(parseFilename('[FLIP1기_5주차]_7팀_시장조사_v2.docx')).toEqual({
      program: 'FLIP1기',
      week: 5,
      team: '7팀',
      task: '시장조사_v2',
      ext: 'docx',
    })
  })

  it('확장자는 소문자로 normalize', () => {
    expect(parseFilename('[KVP_2주차]_1팀_과제.PDF')?.ext).toBe('pdf')
  })

  it('규칙에 안 맞는 파일명은 null', () => {
    expect(parseFilename('이건_아무거나.pdf')).toBeNull()
    expect(parseFilename('[FLIP1기]_3팀_과제.pdf')).toBeNull()
    expect(parseFilename('FLIP1기_3주차_3팀_과제.pdf')).toBeNull()
  })

  it('대괄호 안에 언더스코어 한 개만 허용', () => {
    expect(parseFilename('[A_B_3주차]_1팀_과제.pdf')).toBeNull()
  })

  it('week 은 정수 (NaN 방지)', () => {
    const r = parseFilename('[FLIP1기_12주차]_10팀_과제.pdf')
    expect(r?.week).toBe(12)
    expect(typeof r?.week).toBe('number')
  })
})

describe('parseFilenames', () => {
  it('성공/실패 분리', () => {
    const { parsed, unmatched } = parseFilenames([
      '[FLIP1기_1주차]_1팀_과제.pdf',
      '랜덤.docx',
      '[FLIP1기_2주차]_2팀_과제.pdf',
    ])
    expect(parsed).toHaveLength(2)
    expect(unmatched).toEqual(['랜덤.docx'])
  })

  it('빈 입력', () => {
    const { parsed, unmatched } = parseFilenames([])
    expect(parsed).toEqual([])
    expect(unmatched).toEqual([])
  })
})
