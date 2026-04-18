/**
 * persona_automations의 frequency/run_* 필드로 다음 실행 시각 계산.
 *
 * KST(UTC+9) 기준으로 시간 해석 — 한국 동아리 대상이라 UI·DB 모두 KST 정수로 저장.
 * 주 시작은 월요일(0=월, 6=일)로 통일.
 *
 * 주의: JavaScript Date는 UTC 연산이 기본. 로컬 시간 계산 시 "해당 지역"을
 * 가정하면 서버 타임존에 따라 결과가 달라질 수 있어, 명시적으로 KST offset을 적용한다.
 */

export type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface ScheduleConfig {
  frequency: Frequency
  run_hour: number
  run_minute: number
  run_weekday: number | null // 0=월 ... 6=일 (weekly/biweekly만)
  run_day_of_month: number | null // 1~28 (monthly만)
}

const KST_OFFSET_MINUTES = 9 * 60

/**
 * 주어진 from 이후의 다음 실행 시각을 계산.
 * - fromUtc가 UTC 시각(보통 now)
 * - 리턴도 UTC ISO string
 */
export function computeNextRunAt(
  config: ScheduleConfig,
  fromUtc: Date = new Date(),
): string {
  // KST 로컬 기준으로 변환해서 계산 후 UTC로 되돌림
  const fromKst = utcToKst(fromUtc)
  let next = nextFromKst(config, fromKst)
  // 안전 가드: from보다 과거/동일이면 한 주기 밀기
  if (next.getTime() <= fromKst.getTime()) {
    next = advanceOneCycle(config, next)
  }
  return kstToUtc(next).toISOString()
}

function nextFromKst(config: ScheduleConfig, fromKst: Date): Date {
  const base = new Date(fromKst)
  base.setUTCSeconds(0, 0)
  base.setUTCHours(config.run_hour, config.run_minute, 0, 0)

  if (config.frequency === 'daily') {
    if (base.getTime() <= fromKst.getTime()) {
      base.setUTCDate(base.getUTCDate() + 1)
    }
    return base
  }

  if (config.frequency === 'weekly' || config.frequency === 'biweekly') {
    const target = config.run_weekday ?? 0
    const currentWd = (base.getUTCDay() + 6) % 7 // JS 일=0 → 월=0 보정
    let diff = target - currentWd
    if (diff < 0) diff += 7
    base.setUTCDate(base.getUTCDate() + diff)
    if (base.getTime() <= fromKst.getTime()) {
      base.setUTCDate(base.getUTCDate() + (config.frequency === 'biweekly' ? 14 : 7))
    }
    return base
  }

  // monthly
  const dom = config.run_day_of_month ?? 1
  base.setUTCDate(dom)
  if (base.getTime() <= fromKst.getTime()) {
    base.setUTCMonth(base.getUTCMonth() + 1)
    base.setUTCDate(dom)
  }
  return base
}

function advanceOneCycle(config: ScheduleConfig, d: Date): Date {
  const next = new Date(d)
  switch (config.frequency) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + 1)
      break
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + 7)
      break
    case 'biweekly':
      next.setUTCDate(next.getUTCDate() + 14)
      break
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + 1)
      break
  }
  return next
}

function utcToKst(utc: Date): Date {
  return new Date(utc.getTime() + KST_OFFSET_MINUTES * 60_000)
}

function kstToUtc(kst: Date): Date {
  return new Date(kst.getTime() - KST_OFFSET_MINUTES * 60_000)
}
