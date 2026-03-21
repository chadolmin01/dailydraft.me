/**
 * Contest Korea Crawler
 * 콘테스트코리아 공모전 정보 수집
 *
 * Note: 실제 크롤링은 Puppeteer가 필요합니다.
 * 서버리스 환경에서는 외부 크롤러 서비스나 edge function 사용을 권장합니다.
 */

import type { TransformedEvent } from '@/src/types/startup-events';
import type { RawCrawledEvent, CrawlOptions } from './types';

const BASE_URL = 'https://www.contestkorea.com';

// 카테고리 URL 매핑
const CATEGORIES = {
  all: '/sub/list.php?int_gbn=1&Txt_bcode=030110001',
  idea: '/sub/list.php?int_gbn=1&Txt_bcode=030110001',
  design: '/sub/list.php?int_gbn=1&Txt_bcode=030810001',
  marketing: '/sub/list.php?int_gbn=1&Txt_bcode=030210001',
};

/**
 * Contest Korea에서 공모전 목록 수집
 *
 * 서버리스 환경에서는 이 함수 대신 /api/cron/ingest-crawled-events를 통해
 * 외부 크롤러의 결과를 받아야 합니다.
 */
export async function crawlContestKorea(
  _options: CrawlOptions = {}
): Promise<TransformedEvent[]> {
  // Puppeteer 기반 크롤링은 서버리스 환경에서 제한적
  // 대신 API를 통해 외부 크롤러 결과를 수신하는 방식 사용
  console.warn(
    'Contest Korea crawling requires Puppeteer. ' +
    'Use external crawler service with /api/cron/ingest-crawled-events endpoint.'
  );

  return [];
}

/**
 * RawCrawledEvent를 TransformedEvent로 변환
 */
export function transformContestKoreaEvent(raw: RawCrawledEvent): TransformedEvent {
  // 이벤트 유형 결정
  const eventType = determineEventType(raw);

  // 종료일 기본값
  let registrationEndDate = raw.registrationEndDate || raw.endDate;
  if (!registrationEndDate) {
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    registrationEndDate = defaultEnd.toISOString().split('T')[0];
  }

  return {
    external_id: `contestkorea:${raw.sourceId}`,
    source: 'contestkorea',
    title: raw.title,
    organizer: raw.organizer || '콘테스트코리아',
    event_type: eventType,
    description: raw.description || null,
    start_date: raw.startDate || null,
    end_date: raw.endDate || null,
    registration_start_date: raw.registrationStartDate || null,
    registration_end_date: registrationEndDate,
    registration_url: raw.registrationUrl || raw.sourceUrl,
    views_count: 0,
    target_audience: raw.targetAudience || null,
    raw_data: raw.rawData || {},
  };
}

/**
 * 카테고리 기반 이벤트 유형 결정
 */
function determineEventType(
  raw: RawCrawledEvent
): '사업화' | '시설·공간' | '행사·네트워크' | '글로벌' | '창업교육' {
  const category = raw.category?.toLowerCase() || '';
  const title = raw.title.toLowerCase();
  const description = raw.description?.toLowerCase() || '';

  // 창업/사업화 키워드
  const businessKeywords = ['창업', '스타트업', '사업화', '비즈니스', '투자'];
  if (businessKeywords.some(k =>
    title.includes(k) || description.includes(k) || category.includes(k)
  )) {
    return '사업화';
  }

  // 교육 키워드
  const educationKeywords = ['교육', '멘토링', '강좌', '세미나', '워크샵'];
  if (educationKeywords.some(k =>
    title.includes(k) || description.includes(k)
  )) {
    return '창업교육';
  }

  // 글로벌 키워드
  const globalKeywords = ['글로벌', '해외', 'global', 'international'];
  if (globalKeywords.some(k =>
    title.includes(k) || description.includes(k)
  )) {
    return '글로벌';
  }

  // 기본값: 행사·네트워크
  return '행사·네트워크';
}

/**
 * 여러 RawCrawledEvent 일괄 변환
 */
export function transformContestKoreaEvents(
  events: RawCrawledEvent[]
): TransformedEvent[] {
  return events
    .filter(e => e.source === 'contestkorea')
    .map(transformContestKoreaEvent);
}

export { BASE_URL, CATEGORIES };
