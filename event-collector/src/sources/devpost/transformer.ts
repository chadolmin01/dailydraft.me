/**
 * Devpost 데이터 변환기
 */

import type { DevpostHackathon, TransformedEvent, EventType } from '../../types/index.js';
import {
  parseDevpostDateRange,
  parseTimeLeft,
  getDefaultEndDate,
  cleanText,
  cleanHtml,
  parsePrizeAmount,
  normalizeUrl,
} from '../../utils/index.js';

/**
 * Devpost 해커톤을 공통 이벤트 형식으로 변환
 */
export function transformDevpostHackathon(
  hackathon: DevpostHackathon
): TransformedEvent {
  // 날짜 파싱
  const { start, end } = parseDevpostDateRange(hackathon.submission_period_dates);

  // 종료일이 없으면 time_left_to_submission에서 추론
  let registrationEndDate = end;
  if (!registrationEndDate && hackathon.time_left_to_submission) {
    registrationEndDate = parseTimeLeft(hackathon.time_left_to_submission);
  }
  if (!registrationEndDate) {
    registrationEndDate = getDefaultEndDate();
  }

  // 이벤트 유형 결정
  const eventType = determineEventType(hackathon);

  // 위치 정보
  const location = hackathon.displayed_location?.location || 'Online';

  return {
    external_id: `devpost:${hackathon.id}`,
    source: 'devpost',
    title: cleanText(hackathon.title),
    organizer: cleanText(hackathon.organization_name) || 'Devpost',
    event_type: eventType,
    description: cleanHtml(hackathon.tagline),
    start_date: start,
    end_date: end,
    registration_start_date: null, // Devpost는 시작일 정보 없음
    registration_end_date: registrationEndDate,
    registration_url: normalizeUrl(hackathon.url),
    views_count: hackathon.registrations_count || 0,
    target_audience: '개발자, 디자이너, 창업가',
    location,
    prize_amount: parsePrizeAmount(hackathon.prize_amount),
    raw_data: hackathon as unknown as Record<string, unknown>,
  };
}

/**
 * 테마 기반 이벤트 유형 결정
 */
function determineEventType(hackathon: DevpostHackathon): EventType {
  // themes가 문자열 배열 또는 객체 배열일 수 있음
  const rawThemes = hackathon.themes || [];
  const themes = rawThemes.map((t) => {
    if (typeof t === 'string') return t.toLowerCase();
    if (typeof t === 'object' && t !== null && 'name' in t) return String((t as { name: string }).name).toLowerCase();
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

  // 사업화 키워드 (투자, 비즈니스 등)
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
 * 여러 해커톤 일괄 변환
 */
export function transformDevpostHackathons(
  hackathons: DevpostHackathon[]
): TransformedEvent[] {
  return hackathons.map(transformDevpostHackathon);
}
