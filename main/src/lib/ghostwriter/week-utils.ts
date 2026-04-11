/**
 * 주차 계산 + Discord snowflake ↔ Date 변환 유틸리티.
 * 3개 크론 파일에서 중복 사용되므로 공유 모듈로 추출.
 */

/** ISO 8601 주차 번호 계산 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** 주어진 날짜가 속한 주의 월요일 00:00 (로컬 기준) */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7 // 일요일=7
  d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

const DISCORD_EPOCH = 1420070400000n

/** Discord snowflake ID에서 생성 시각 추출 */
export function snowflakeToDate(snowflake: string): Date {
  const id = BigInt(snowflake)
  const timestamp = Number((id >> 22n) + DISCORD_EPOCH)
  return new Date(timestamp)
}

/**
 * Date → Discord snowflake 변환 (시간 기반 커서용).
 * 커서 기반 대신 시간 기반 메시지 fetch에 사용.
 * 생성된 snowflake는 해당 시각의 "가장 이른" ID를 나타낸다.
 */
export function dateToSnowflake(date: Date): string {
  const ms = BigInt(date.getTime())
  const snowflake = (ms - DISCORD_EPOCH) << 22n
  return snowflake.toString()
}
