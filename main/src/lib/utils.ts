import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 한국 시간(KST) 기준 날짜 반환 (YYYY-MM-DD 형식)
 * 서버/클라이언트 타임존 불일치 방지를 위해 항상 Asia/Seoul 기준 사용
 */
export function getKSTDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date)
}

/**
 * 오늘로부터 N일 후의 KST 날짜 반환
 */
export function getKSTDateAfterDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return getKSTDate(date)
}

/**
 * Update URL search params with new values
 * @param current - Current URLSearchParams or string
 * @param updates - Key-value pairs to update (null value removes the key)
 * @returns New query string
 */
export function updateSearchParams(
  current: URLSearchParams | string,
  updates: Record<string, string | null>
): string {
  const params = typeof current === 'string'
    ? new URLSearchParams(current)
    : new URLSearchParams(current.toString())

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  }

  return params.toString()
}

/**
 * 상대 시간 표시 (예: "방금", "3분 전", "2일 전")
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
