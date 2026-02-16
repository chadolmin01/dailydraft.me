/**
 * Twitter/X Crawler (2차 구현)
 *
 * 타겟 키워드:
 * - 해커톤 모집
 * - 창업대회 공고
 * - 스타트업 밋업
 * - hackathon registration
 *
 * 구현 고려사항:
 * 1. Twitter API v2 사용 (개발자 계정 필요)
 * 2. 최근 트윗 검색 (7일 제한)
 * 3. 이벤트 관련 트윗 필터링
 * 4. 링크에서 실제 이벤트 정보 추출
 */

import { BaseCrawler } from '../crawlers/base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';

// 검색 키워드
const SEARCH_QUERIES = [
  '해커톤 모집',
  '해커톤 참가자',
  '창업대회 공고',
  '창업대회 접수',
  '스타트업 밋업',
  'hackathon registration',
  'hackathon 2024',
  'startup event korea',
];

// 신뢰할 수 있는 계정 목록
const TRUSTED_ACCOUNTS = [
  'kikistartuphub',
  'seoulstartup',
  'maboroshiinc',
  'startupkorea',
];

export class TwitterCrawler extends BaseCrawler {
  private bearerToken: string | null = null;

  constructor() {
    super('twitter', 'https://twitter.com');
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || null;
  }

  /**
   * Search Twitter for event-related tweets
   */
  async getEventList(_options: CrawlOptions = {}): Promise<string[]> {
    if (!this.bearerToken) {
      this.logger.warn('Twitter crawler requires TWITTER_BEARER_TOKEN');
      return [];
    }

    this.logger.warn('Twitter crawler not yet implemented');
    this.logger.info('Search queries:', SEARCH_QUERIES);

    // TODO: Implement using Twitter API v2
    // 1. For each query, search recent tweets
    // 2. Filter by engagement (likes, retweets)
    // 3. Extract URLs from tweets
    // 4. Return unique URLs for further processing

    return [];
  }

  /**
   * Twitter doesn't have "event pages" - we extract info from tweets
   */
  async crawlEventPage(_url: string): Promise<RawCrawledEvent | null> {
    // For Twitter, we would:
    // 1. Parse the tweet for event info
    // 2. Follow any links to get full event details
    // 3. Combine info from tweet and linked page

    return null;
  }

  /**
   * Search tweets using Twitter API v2
   */
  private async searchTweets(query: string, maxResults = 100): Promise<Tweet[]> {
    if (!this.bearerToken) return [];

    try {
      const url = new URL('https://api.twitter.com/2/tweets/search/recent');
      url.searchParams.set('query', `${query} -is:retweet lang:ko`);
      url.searchParams.set('max_results', String(maxResults));
      url.searchParams.set('tweet.fields', 'created_at,entities,public_metrics');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json() as { data?: Tweet[] };
      return data.data || [];

    } catch (error) {
      this.logger.error(`Twitter search failed: ${(error as Error).message}`);
      return [];
    }
  }
}

/**
 * Extract event info from tweet text
 */
export function parseTweetForEvent(tweet: Tweet): Partial<RawCrawledEvent> | null {
  const text = tweet.text;

  // Check if tweet mentions event keywords
  const eventKeywords = ['해커톤', '창업대회', '공모전', '밋업', 'hackathon', 'meetup'];
  const hasEventKeyword = eventKeywords.some(k => text.toLowerCase().includes(k.toLowerCase()));

  if (!hasEventKeyword) {
    return null;
  }

  // Extract URLs
  const urls = tweet.entities?.urls?.map(u => u.expanded_url) || [];

  // Try to extract dates
  const dateMatch = text.match(/(\d{1,2})[\/\.](\d{1,2})/);
  let registrationEndDate: string | undefined;
  if (dateMatch) {
    const month = dateMatch[1].padStart(2, '0');
    const day = dateMatch[2].padStart(2, '0');
    const year = new Date().getFullYear();
    registrationEndDate = `${year}-${month}-${day}`;
  }

  return {
    sourceId: tweet.id,
    sourceUrl: `https://twitter.com/i/web/status/${tweet.id}`,
    title: text.slice(0, 100).replace(/https?:\/\/\S+/g, '').trim(),
    description: text,
    registrationUrl: urls[0],
    registrationEndDate,
    tags: tweet.entities?.hashtags?.map(h => h.tag) || [],
  };
}

// Twitter API types
interface Tweet {
  id: string;
  text: string;
  created_at?: string;
  entities?: {
    urls?: Array<{ expanded_url: string }>;
    hashtags?: Array<{ tag: string }>;
  };
  public_metrics?: {
    like_count: number;
    retweet_count: number;
  };
}
