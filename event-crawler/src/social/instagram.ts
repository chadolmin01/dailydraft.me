/**
 * Instagram Hashtag Crawler (2차 구현)
 *
 * 타겟 해시태그:
 * - #창업대회
 * - #해커톤
 * - #스타트업이벤트
 * - #공모전
 *
 * 구현 고려사항:
 * 1. Instagram API (Graph API) 사용 - 비즈니스 계정 필요
 * 2. 또는 Puppeteer로 공개 프로필 크롤링
 * 3. Rate limiting 엄격하게 적용
 * 4. 이미지에서 텍스트 추출 (OCR) 필요할 수 있음
 */

import { BaseCrawler } from '../crawlers/base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

const TARGET_HASHTAGS = [
  '창업대회',
  '해커톤',
  '스타트업이벤트',
  '공모전',
  '대외활동',
  'hackathon',
  'startup',
];

export class InstagramCrawler extends BaseCrawler {
  constructor() {
    super('instagram', 'https://www.instagram.com');
  }

  /**
   * Instagram hashtag search requires API access or browser automation
   * This is a placeholder for future implementation
   */
  async getEventList(_options: CrawlOptions = {}): Promise<string[]> {
    this.logger.warn('Instagram crawler not yet implemented');
    this.logger.info('Target hashtags:', TARGET_HASHTAGS);

    // TODO: Implement using Instagram Graph API or Puppeteer
    // 1. For each hashtag, search recent posts
    // 2. Extract post URLs that look like event announcements
    // 3. Return URLs for detailed crawling

    return [];
  }

  /**
   * Parse an Instagram post for event information
   */
  async crawlEventPage(_url: string): Promise<RawCrawledEvent | null> {
    // TODO: Implement
    // 1. Navigate to post
    // 2. Extract caption text
    // 3. Parse for event details (dates, links, etc.)
    // 4. Optionally use OCR on images

    return null;
  }
}

/**
 * Helper to parse Instagram caption for event info
 */
export function parseInstagramCaption(caption: string): Partial<RawCrawledEvent> {
  const event: Partial<RawCrawledEvent> = {};

  // Extract title (usually first line or bold text)
  const lines = caption.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    event.title = lines[0].replace(/[📢🎉🔥✨]/g, '').trim();
  }

  // Extract dates (common Korean date formats)
  const datePatterns = [
    /(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/g,  // 2024.01.15
    /(\d{1,2})월\s*(\d{1,2})일/g,              // 1월 15일
    /마감[:\s]*(\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = caption.match(pattern);
    if (match) {
      // Parse and store dates
      // This would need more sophisticated parsing
      break;
    }
  }

  // Extract URLs
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = caption.match(urlPattern);
  if (urls && urls.length > 0) {
    event.registrationUrl = urls[0];
  }

  // Extract hashtags as tags
  const hashtagPattern = /#(\w+)/g;
  const hashtags = [...caption.matchAll(hashtagPattern)].map(m => m[1]);
  event.tags = hashtags;

  return event;
}
