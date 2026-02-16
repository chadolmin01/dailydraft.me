/**
 * Devpost API 클라이언트 - 해커톤 수집
 */

import type { TransformedEvent } from '@/src/types/startup-events';

// Devpost API 엔드포인트
const DEVPOST_API_BASE = 'https://devpost.com/api/hackathons';

interface DevpostHackathon {
  id: string;
  title: string;
  tagline: string | null;
  url: string;
  thumbnail_url: string | null;
  submission_period_dates: string;
  time_left_to_submission: string | null;
  prize_amount: string | null;
  registrations_count: number;
  themes: (string | { name: string })[];
  displayed_location: {
    location: string;
  } | null;
  organization_name: string | null;
  open: boolean;
}

interface DevpostAPIResponse {
  hackathons: DevpostHackathon[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

interface FetchOptions {
  page?: number;
  perPage?: number;
  status?: 'upcoming' | 'open' | 'ended';
  maxPages?: number;
  includeOnline?: boolean;
}

/**
 * Devpost 해커톤 목록 조회
 */
async function fetchDevpostPage(options: {
  page: number;
  perPage: number;
  status: string;
}): Promise<DevpostHackathon[]> {
  const params = new URLSearchParams({
    page: String(options.page),
    per_page: String(options.perPage),
    status: options.status,
  });

  const url = `${DEVPOST_API_BASE}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'TeamBuilder-EventCollector/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Devpost API error: ${response.status}`);
  }

  const data: DevpostAPIResponse = await response.json();
  return data.hackathons || [];
}

/**
 * 모든 오픈 해커톤 수집
 */
export async function collectDevpostHackathons(
  options: FetchOptions = {}
): Promise<TransformedEvent[]> {
  const {
    maxPages = 5,
    perPage = 24,
    status = 'open',
    includeOnline = true,
  } = options;

  const allHackathons: DevpostHackathon[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    const hackathons = await fetchDevpostPage({
      page: currentPage,
      perPage,
      status,
    });

    if (hackathons.length === 0) {
      break;
    }

    // 온라인 또는 한국 해커톤 필터링
    const filtered = hackathons.filter((h) => {
      const location = h.displayed_location?.location?.toLowerCase() || '';
      const isOnline = location === 'online' || location.includes('virtual');
      const isKorea = location.includes('korea') || location.includes('seoul');
      return includeOnline ? (isOnline || isKorea) : isKorea;
    });

    allHackathons.push(...filtered);

    hasMore = hackathons.length === perPage;
    currentPage++;

    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
  }

  // TransformedEvent로 변환
  return allHackathons.map(transformDevpostHackathon);
}

/**
 * Devpost 해커톤을 TransformedEvent로 변환
 */
function transformDevpostHackathon(hackathon: DevpostHackathon): TransformedEvent {
  const { start, end } = parseDevpostDateRange(hackathon.submission_period_dates);

  // 종료일 추론
  let registrationEndDate = end;
  if (!registrationEndDate && hackathon.time_left_to_submission) {
    registrationEndDate = parseTimeLeft(hackathon.time_left_to_submission);
  }
  if (!registrationEndDate) {
    // 기본값: 30일 후
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    registrationEndDate = defaultEnd.toISOString().split('T')[0];
  }

  const eventType = determineEventType(hackathon);
  const location = hackathon.displayed_location?.location || 'Online';

  return {
    external_id: `devpost:${hackathon.id}`,
    source: 'devpost',
    title: cleanText(hackathon.title) || hackathon.title,
    organizer: cleanText(hackathon.organization_name) || 'Devpost',
    event_type: eventType,
    description: cleanText(hackathon.tagline),
    start_date: start,
    end_date: end,
    registration_start_date: null,
    registration_end_date: registrationEndDate,
    registration_url: hackathon.url,
    views_count: hackathon.registrations_count || 0,
    target_audience: '개발자, 디자이너, 창업가',
    raw_data: hackathon as unknown as Record<string, unknown>,
  };
}

/**
 * 이벤트 유형 결정
 */
function determineEventType(
  hackathon: DevpostHackathon
): '사업화' | '시설·공간' | '행사·네트워크' | '글로벌' | '창업교육' {
  const themes = (hackathon.themes || []).map((t) => {
    if (typeof t === 'string') return t.toLowerCase();
    if (typeof t === 'object' && t !== null && 'name' in t) return t.name.toLowerCase();
    return '';
  }).filter(Boolean);

  const title = hackathon.title.toLowerCase();
  const tagline = hackathon.tagline?.toLowerCase() || '';

  // 글로벌 키워드
  const globalKeywords = ['global', 'international', 'worldwide', '글로벌'];
  if (
    globalKeywords.some((k) => title.includes(k) || tagline.includes(k)) ||
    themes.some((t) => globalKeywords.some((k) => t.includes(k)))
  ) {
    return '글로벌';
  }

  // 교육 키워드
  const educationKeywords = ['education', 'learning', 'student', '교육', '학생'];
  if (
    educationKeywords.some((k) => title.includes(k) || tagline.includes(k)) ||
    themes.some((t) => educationKeywords.some((k) => t.includes(k)))
  ) {
    return '창업교육';
  }

  // 사업화 키워드
  const businessKeywords = ['startup', 'business', 'enterprise', '스타트업', '창업'];
  if (
    businessKeywords.some((k) => title.includes(k) || tagline.includes(k)) ||
    themes.some((t) => businessKeywords.some((k) => t.includes(k)))
  ) {
    return '사업화';
  }

  // 기본값: 행사·네트워크 (해커톤)
  return '행사·네트워크';
}

/**
 * Devpost 날짜 범위 파싱 (예: "Jan 15 - Feb 28, 2024")
 */
function parseDevpostDateRange(dateStr: string): { start: string | null; end: string | null } {
  if (!dateStr) return { start: null, end: null };

  try {
    // "Jan 15 - Feb 28, 2024" 형식
    const parts = dateStr.split(' - ');
    if (parts.length !== 2) return { start: null, end: null };

    const [startPart, endPart] = parts;

    // 연도 추출
    const yearMatch = endPart.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : new Date().getFullYear().toString();

    // 시작일 파싱
    const startDate = parseMonthDay(startPart, year);

    // 종료일 파싱 (연도 포함)
    const endDate = parseMonthDay(endPart.replace(/,?\s*\d{4}/, ''), year);

    return { start: startDate, end: endDate };
  } catch {
    return { start: null, end: null };
  }
}

/**
 * 월/일 문자열을 ISO 날짜로 변환
 */
function parseMonthDay(str: string, year: string): string | null {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  const match = str.trim().toLowerCase().match(/([a-z]+)\s+(\d+)/);
  if (!match) return null;

  const month = months[match[1].substring(0, 3)];
  const day = match[2].padStart(2, '0');

  if (!month) return null;

  return `${year}-${month}-${day}`;
}

/**
 * "X days left" 형식에서 종료일 추론
 */
function parseTimeLeft(timeLeft: string): string | null {
  const match = timeLeft.match(/(\d+)\s*(day|hour|week|month)/i);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const endDate = new Date();

  switch (unit) {
    case 'hour':
      endDate.setHours(endDate.getHours() + value);
      break;
    case 'day':
      endDate.setDate(endDate.getDate() + value);
      break;
    case 'week':
      endDate.setDate(endDate.getDate() + value * 7);
      break;
    case 'month':
      endDate.setMonth(endDate.getMonth() + value);
      break;
  }

  return endDate.toISOString().split('T')[0];
}

/**
 * 텍스트 정리
 */
function cleanText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.replace(/\s+/g, ' ').trim() || null;
}
