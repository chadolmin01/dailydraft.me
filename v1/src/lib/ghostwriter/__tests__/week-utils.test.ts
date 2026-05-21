import { describe, it, expect } from 'vitest'
import { getISOWeekNumber, getMondayOfWeek, snowflakeToDate, dateToSnowflake } from '../week-utils'

describe('getISOWeekNumber', () => {
  it('2026-01-01 (목) → 1주차', () => {
    expect(getISOWeekNumber(new Date('2026-01-01'))).toBe(1)
  })

  it('2026-04-11 (토) → 15주차', () => {
    expect(getISOWeekNumber(new Date('2026-04-11'))).toBe(15)
  })

  it('2025-12-29 (월) → 1주차 (다음 해 ISO week)', () => {
    expect(getISOWeekNumber(new Date('2025-12-29'))).toBe(1)
  })

  it('2026-12-31 (목) → 53주차', () => {
    expect(getISOWeekNumber(new Date('2026-12-31'))).toBe(53)
  })
})

describe('getMondayOfWeek', () => {
  it('금요일 → 해당 주 월요일', () => {
    const friday = new Date('2026-04-10T15:30:00')
    const monday = getMondayOfWeek(friday)
    expect(monday.getDay()).toBe(1) // 월요일
    expect(monday.getDate()).toBe(6)
    expect(monday.getHours()).toBe(0)
  })

  it('월요일 → 자기 자신', () => {
    const monday = new Date('2026-04-06')
    const result = getMondayOfWeek(monday)
    expect(result.getDate()).toBe(6)
  })

  it('일요일 → 해당 주 월요일 (직전 월요일)', () => {
    const sunday = new Date('2026-04-12')
    const result = getMondayOfWeek(sunday)
    expect(result.getDate()).toBe(6)
  })
})

describe('snowflake ↔ date 변환', () => {
  it('snowflakeToDate → 알려진 Discord 시각과 일치', () => {
    // Discord epoch: 2015-01-01T00:00:00.000Z → snowflake 0
    const d = snowflakeToDate('0')
    expect(d.getTime()).toBe(1420070400000)
  })

  it('dateToSnowflake → snowflakeToDate 왕복 (roundtrip)', () => {
    const original = new Date('2026-04-11T12:00:00Z')
    const snowflake = dateToSnowflake(original)
    const restored = snowflakeToDate(snowflake)
    // snowflake는 ms 정밀도이므로 완전 일치해야 함
    expect(restored.getTime()).toBe(original.getTime())
  })

  it('dateToSnowflake 결과는 문자열 숫자', () => {
    const s = dateToSnowflake(new Date('2026-01-01'))
    expect(typeof s).toBe('string')
    expect(Number.isFinite(Number(s))).toBe(true)
  })
})
