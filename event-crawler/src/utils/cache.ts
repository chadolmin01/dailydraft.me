/**
 * Upstash Redis Cache Manager
 *
 * 기능:
 * - 크롤링된 URL 캐싱 (중복 방지)
 * - 검색 결과 캐싱 (API 호출 절약)
 * - TTL 기반 자동 만료
 */

import { Redis } from '@upstash/redis';
import { logger } from './logger.js';

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  URL: 6 * 60 * 60,           // 6시간 - 크롤링된 URL
  SEARCH_RESULT: 60 * 60,     // 1시간 - 검색 결과
  EVENT: 24 * 60 * 60,        // 24시간 - 이벤트 데이터
};

// Cache key prefixes
const CACHE_PREFIX = {
  URL: 'crawler:url:',
  SEARCH: 'crawler:search:',
  EVENT: 'crawler:event:',
};

export class CacheManager {
  private redis: Redis | null = null;
  private available: boolean = false;

  constructor() {
    this.connect();
  }

  /**
   * Upstash Redis 연결
   */
  private connect(): void {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      logger.info('Upstash credentials not configured - running without cache');
      return;
    }

    try {
      this.redis = new Redis({
        url,
        token,
      });
      this.available = true;
      logger.info('Upstash Redis connected');
    } catch (error) {
      logger.warn(`Upstash init failed: ${(error as Error).message}`);
      this.redis = null;
    }
  }

  /**
   * 캐시 사용 가능 여부
   */
  isAvailable(): boolean {
    return this.available && this.redis !== null;
  }

  /**
   * URL이 이미 크롤링되었는지 확인
   */
  async isUrlCrawled(url: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = CACHE_PREFIX.URL + this.hashUrl(url);
      const exists = await this.redis!.exists(key);
      return exists === 1;
    } catch {
      return false;
    }
  }

  /**
   * URL을 크롤링됨으로 마킹
   */
  async markUrlCrawled(url: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const key = CACHE_PREFIX.URL + this.hashUrl(url);
      await this.redis!.setex(key, CACHE_TTL.URL, '1');
    } catch (error) {
      logger.debug(`Failed to mark URL: ${(error as Error).message}`);
    }
  }

  /**
   * 여러 URL 중 크롤링되지 않은 것만 필터
   */
  async filterUncrawledUrls(urls: string[]): Promise<string[]> {
    if (!this.isAvailable()) return urls;
    if (urls.length === 0) return [];

    try {
      // Upstash pipeline for batch operations
      const pipeline = this.redis!.pipeline();
      const keys = urls.map(url => CACHE_PREFIX.URL + this.hashUrl(url));

      for (const key of keys) {
        pipeline.exists(key);
      }

      const results = await pipeline.exec<number[]>();

      return urls.filter((_, i) => results[i] === 0);
    } catch (error) {
      logger.debug(`Filter error: ${(error as Error).message}`);
      return urls;
    }
  }

  /**
   * 여러 URL을 크롤링됨으로 마킹
   */
  async markUrlsCrawled(urls: string[]): Promise<void> {
    if (!this.isAvailable()) return;
    if (urls.length === 0) return;

    try {
      const pipeline = this.redis!.pipeline();

      for (const url of urls) {
        const key = CACHE_PREFIX.URL + this.hashUrl(url);
        pipeline.setex(key, CACHE_TTL.URL, '1');
      }

      await pipeline.exec();
    } catch (error) {
      logger.debug(`Failed to mark URLs: ${(error as Error).message}`);
    }
  }

  /**
   * 검색 결과 캐시 가져오기
   */
  async getSearchResult<T>(keyword: string, type: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = CACHE_PREFIX.SEARCH + `${type}:${this.hashString(keyword)}`;
      const data = await this.redis!.get<T>(key);

      if (data) {
        logger.debug(`Cache hit: ${type}/${keyword}`);
        return data;
      }
    } catch {
      // Ignore
    }

    return null;
  }

  /**
   * 검색 결과 캐시 저장
   */
  async setSearchResult<T>(keyword: string, type: string, data: T): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const key = CACHE_PREFIX.SEARCH + `${type}:${this.hashString(keyword)}`;
      await this.redis!.setex(key, CACHE_TTL.SEARCH_RESULT, data);
    } catch (error) {
      logger.debug(`Failed to cache search result: ${(error as Error).message}`);
    }
  }

  /**
   * 이벤트 데이터 캐시
   */
  async cacheEvent(externalId: string, event: unknown): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const key = CACHE_PREFIX.EVENT + externalId;
      await this.redis!.setex(key, CACHE_TTL.EVENT, event);
    } catch (error) {
      logger.debug(`Failed to cache event: ${(error as Error).message}`);
    }
  }

  /**
   * 캐시된 이벤트 가져오기
   */
  async getCachedEvent<T>(externalId: string): Promise<T | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = CACHE_PREFIX.EVENT + externalId;
      return await this.redis!.get<T>(key);
    } catch {
      return null;
    }
  }

  /**
   * 캐시 통계 조회
   */
  async getStats(): Promise<{ urls: number; searches: number; events: number } | null> {
    if (!this.isAvailable()) return null;

    try {
      const [urls, searches, events] = await Promise.all([
        this.countKeys(CACHE_PREFIX.URL),
        this.countKeys(CACHE_PREFIX.SEARCH),
        this.countKeys(CACHE_PREFIX.EVENT),
      ]);

      return { urls, searches, events };
    } catch {
      return null;
    }
  }

  /**
   * 패턴에 맞는 키 개수 (Upstash SCAN 사용)
   */
  private async countKeys(prefix: string): Promise<number> {
    if (!this.redis) return 0;

    let count = 0;
    let cursor: string | number = 0;

    try {
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, {
          match: `${prefix}*`,
          count: 100,
        }) as [string | number, string[]];
        cursor = nextCursor;
        count += keys.length;
      } while (cursor !== 0 && cursor !== '0');
    } catch {
      // Ignore scan errors
    }

    return count;
  }

  /**
   * 캐시 초기화 (특정 prefix)
   */
  async clearCache(prefix?: 'url' | 'search' | 'event'): Promise<number> {
    if (!this.isAvailable()) return 0;

    const prefixMap: Record<string, string> = {
      url: CACHE_PREFIX.URL,
      search: CACHE_PREFIX.SEARCH,
      event: CACHE_PREFIX.EVENT,
    };

    const pattern = prefix ? prefixMap[prefix] : 'crawler:';
    let deleted = 0;
    let cursor: string | number = 0;

    try {
      do {
        const [nextCursor, keys] = await this.redis!.scan(cursor, {
          match: `${pattern}*`,
          count: 100,
        }) as [string | number, string[]];
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.redis!.del(...keys);
          deleted += keys.length;
        }
      } while (cursor !== 0 && cursor !== '0');

      logger.info(`Cleared ${deleted} cache entries`);
    } catch (error) {
      logger.error(`Failed to clear cache: ${(error as Error).message}`);
    }

    return deleted;
  }

  /**
   * URL 해시
   */
  private hashUrl(url: string): string {
    return this.hashString(url);
  }

  /**
   * 문자열 해시
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 연결 종료 (Upstash는 stateless라 실제로 필요 없음)
   */
  async disconnect(): Promise<void> {
    this.redis = null;
    this.available = false;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
