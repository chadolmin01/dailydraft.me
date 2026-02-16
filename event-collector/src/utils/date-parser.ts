/**
 * 날짜 파싱 유틸리티
 * backend/src/lib/utils.ts 패턴 기반
 */

import { format, parse, parseISO, isValid, addDays } from 'date-fns';

/**
 * KST 기준 오늘 날짜 반환 (YYYY-MM-DD)
 */
export function getKSTDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);
}

/**
 * KST 기준 N일 후 날짜 반환
 */
export function getKSTDateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return getKSTDate(date);
}

/**
 * 다양한 형식의 날짜 문자열을 ISO 날짜로 파싱
 */
export function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();

  // ISO format (YYYY-MM-DD or full ISO)
  if (cleaned.includes('-')) {
    try {
      const date = parseISO(cleaned);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch {
      // Continue to other formats
    }
  }

  // YYYYMMDD format
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    const year = cleaned.substring(0, 4);
    const month = cleaned.substring(4, 6);
    const day = cleaned.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    if (isValid(date)) {
      return `${year}-${month}-${day}`;
    }
  }

  // US format (MM/DD/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
    try {
      const date = parse(cleaned, 'M/d/yyyy', new Date());
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch {
      // Continue
    }
  }

  return null;
}

/**
 * Devpost 날짜 범위 파싱 (예: "Jan 15 - Feb 28, 2024")
 */
export function parseDevpostDateRange(dateRange: string): {
  start: string | null;
  end: string | null;
} {
  if (!dateRange) {
    return { start: null, end: null };
  }

  // 패턴: "Jan 15 - Feb 28, 2024" or "Jan 15, 2024 - Feb 28, 2024"
  const parts = dateRange.split(' - ');
  if (parts.length !== 2) {
    return { start: null, end: null };
  }

  const [startPart, endPart] = parts;

  // 연도 추출 (끝 부분에서)
  const yearMatch = endPart.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

  try {
    // 시작일 파싱
    let startStr = startPart.trim();
    if (!startStr.includes(year)) {
      startStr += `, ${year}`;
    }
    const startDate = parse(startStr, 'MMM d, yyyy', new Date());

    // 종료일 파싱
    const endStr = endPart.trim();
    const endDate = parse(endStr, 'MMM d, yyyy', new Date());

    return {
      start: isValid(startDate) ? format(startDate, 'yyyy-MM-dd') : null,
      end: isValid(endDate) ? format(endDate, 'yyyy-MM-dd') : null,
    };
  } catch {
    return { start: null, end: null };
  }
}

/**
 * 상대적 시간 문자열 파싱 (예: "3 days left")
 */
export function parseTimeLeft(timeLeft: string | null): string | null {
  if (!timeLeft) return null;

  const match = timeLeft.match(/(\d+)\s*(day|hour|week|month)/i);
  if (!match) return null;

  const [, amount, unit] = match;
  const num = parseInt(amount, 10);

  let days = 0;
  switch (unit.toLowerCase()) {
    case 'hour':
      days = 1;
      break;
    case 'day':
      days = num;
      break;
    case 'week':
      days = num * 7;
      break;
    case 'month':
      days = num * 30;
      break;
  }

  return getKSTDateAfterDays(days);
}

/**
 * 이벤트가 만료되었는지 확인
 */
export function isExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  const today = getKSTDate();
  return endDate < today;
}

/**
 * 기본 종료일 반환 (오늘 + 30일)
 */
export function getDefaultEndDate(): string {
  return getKSTDateAfterDays(30);
}
