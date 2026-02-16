/**
 * Facebook Events Crawler (2차 구현)
 *
 * 타겟:
 * - 스타트업 관련 공개 그룹의 이벤트
 * - 창업 지원 기관 페이지 이벤트
 * - 키워드: 해커톤, 창업대회, 스타트업 밋업
 *
 * 구현 고려사항:
 * 1. Facebook Graph API 사용 (앱 등록 필요)
 * 2. 공개 이벤트만 수집 가능
 * 3. Rate limiting 적용
 */

import { BaseCrawler } from '../crawlers/base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

// 스타트업 관련 Facebook 페이지/그룹 목록
const TARGET_PAGES = [
  // 창업 지원 기관
  { id: 'kstartup', name: 'K-Startup' },
  { id: 'seoulfoundation', name: '서울창업허브' },
  { id: 'pangyo.startup', name: '판교 스타트업 캠퍼스' },

  // 스타트업 커뮤니티
  { id: 'startup.weekly', name: '스타트업위클리' },
  { id: 'eoullim', name: '이음' },
];

const EVENT_KEYWORDS = [
  '해커톤',
  '창업대회',
  '밋업',
  '네트워킹',
  '데모데이',
  'hackathon',
  'startup',
  'meetup',
];

export class FacebookCrawler extends BaseCrawler {
  constructor() {
    super('facebook', 'https://www.facebook.com');
  }

  /**
   * Get list of Facebook events
   */
  async getEventList(_options: CrawlOptions = {}): Promise<string[]> {
    this.logger.warn('Facebook crawler not yet implemented');
    this.logger.info('Target pages:', TARGET_PAGES.map(p => p.name));
    this.logger.info('Event keywords:', EVENT_KEYWORDS);

    // TODO: Implement using Facebook Graph API
    // 1. For each target page, fetch events
    // 2. Filter by keywords
    // 3. Return event URLs

    return [];
  }

  /**
   * Parse a Facebook event page
   */
  async crawlEventPage(_url: string): Promise<RawCrawledEvent | null> {
    // TODO: Implement
    // 1. Fetch event details via API or scraping
    // 2. Extract: title, description, dates, location, etc.

    return null;
  }
}

/**
 * Helper to build Facebook Graph API URL
 */
export function buildGraphApiUrl(
  pageId: string,
  accessToken: string,
  fields: string[] = ['name', 'description', 'start_time', 'end_time', 'place']
): string {
  const fieldsParam = fields.join(',');
  return `https://graph.facebook.com/v18.0/${pageId}/events?fields=${fieldsParam}&access_token=${accessToken}`;
}

/**
 * Transform Facebook API event response to our format
 */
export function transformFacebookEvent(fbEvent: FacebookApiEvent): Partial<RawCrawledEvent> {
  return {
    sourceId: fbEvent.id,
    sourceUrl: `https://www.facebook.com/events/${fbEvent.id}`,
    title: fbEvent.name,
    description: fbEvent.description,
    startDate: fbEvent.start_time?.split('T')[0],
    endDate: fbEvent.end_time?.split('T')[0],
    location: fbEvent.place?.name,
    // Registration deadline is usually the event start date
    registrationEndDate: fbEvent.start_time?.split('T')[0],
  };
}

// Facebook API types
interface FacebookApiEvent {
  id: string;
  name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  place?: {
    name: string;
    location?: {
      city?: string;
      country?: string;
    };
  };
}
