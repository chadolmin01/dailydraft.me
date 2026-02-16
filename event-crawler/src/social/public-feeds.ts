/**
 * 공개 피드 크롤러 - API 인증 없이 접근 가능한 소스
 *
 * SNS 직접 크롤링 대신 공개 채널 활용:
 * 1. 스타트업 관련 블로그 RSS
 * 2. 공공기관 공지 RSS
 * 3. 유튜브 채널 RSS (공개)
 */

import { BaseCrawler } from '../crawlers/base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

// 공개 RSS 피드 목록
const PUBLIC_FEEDS = [
  // K-Startup 공지사항
  {
    name: 'K-Startup',
    url: 'https://www.k-startup.go.kr/rss/noticeList.do',
    type: 'rss',
  },
  // 창업진흥원
  {
    name: '창업진흥원',
    url: 'https://www.kised.or.kr/rss.do',
    type: 'rss',
  },
  // 스타트업 블로그들
  {
    name: '벤처스퀘어',
    url: 'https://www.venturesquare.net/feed',
    type: 'rss',
  },
  {
    name: '플래텀',
    url: 'https://platum.kr/feed',
    type: 'rss',
  },
];

// 유튜브 채널 RSS (공개 접근 가능)
const YOUTUBE_CHANNELS = [
  // 채널 ID로 RSS 접근: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
  { name: '창업진흥원', channelId: 'UCxxxxxxxxxx' },
];

export class PublicFeedsCrawler extends BaseCrawler {
  constructor() {
    super('contestkorea', 'https://feeds.example.com'); // 임시
  }

  async getEventList(options: CrawlOptions = {}): Promise<string[]> {
    const urls: string[] = [];

    for (const feed of PUBLIC_FEEDS) {
      try {
        this.logger.info(`Fetching RSS: ${feed.name}`);
        const response = await fetch(feed.url);

        if (!response.ok) {
          this.logger.warn(`Failed to fetch ${feed.name}: ${response.status}`);
          continue;
        }

        const xml = await response.text();
        // RSS 파싱하여 이벤트 관련 항목 추출
        const eventUrls = this.parseRssForEvents(xml);
        urls.push(...eventUrls);

      } catch (error) {
        this.logger.error(`RSS fetch error: ${(error as Error).message}`);
      }
    }

    return urls;
  }

  /**
   * RSS XML에서 이벤트 관련 URL 추출
   */
  private parseRssForEvents(xml: string): string[] {
    const urls: string[] = [];
    const eventKeywords = ['해커톤', '창업대회', '공모전', '모집', '접수', '참가자'];

    // 간단한 RSS 파싱 (실제로는 xml2js 등 사용)
    const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const match of itemMatches) {
      const item = match[1];
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';

      // 이벤트 키워드가 포함된 항목만 추출
      if (eventKeywords.some(kw => title.includes(kw))) {
        urls.push(link);
      }
    }

    return urls;
  }

  async crawlEventPage(url: string): Promise<RawCrawledEvent | null> {
    // RSS 항목에서 직접 정보 추출
    return null;
  }
}

/**
 * Twitter 없이 이벤트 발견하는 방법:
 *
 * 1. Google Alerts 설정
 *    - "해커톤 모집" 알림 → 이메일 → 파싱
 *
 * 2. Naver 검색 API
 *    - https://developers.naver.com/docs/search/blog/
 *    - 블로그/뉴스 검색으로 이벤트 발견
 *
 * 3. 카카오 검색 API
 *    - https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide
 *
 * 4. GitHub Events
 *    - GitHub 해커톤 리포지토리 모니터링
 *    - https://api.github.com/search/repositories?q=hackathon+2024
 */
