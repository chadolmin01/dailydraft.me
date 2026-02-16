/**
 * Upstash Redis 캐시 클라이언트
 */

import { Redis } from '@upstash/redis';
import crypto from 'crypto';

let redisInstance: Redis | null = null;

/**
 * Redis 클라이언트 가져오기
 */
export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[Cache] Upstash credentials not configured, caching disabled');
    return null;
  }

  try {
    redisInstance = new Redis({ url, token });
    console.log('[Cache] Upstash Redis initialized');
    return redisInstance;
  } catch (error) {
    console.error('[Cache] Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * 캐시에서 값 가져오기
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.warn('[Cache] Get error:', error);
    return null;
  }
}

/**
 * 캐시에 값 저장
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.setex(key, ttlSeconds, value);
  } catch (error) {
    console.warn('[Cache] Set error:', error);
  }
}

/**
 * 캐시에서 값 삭제
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.warn('[Cache] Del error:', error);
  }
}

/**
 * 패턴으로 캐시 삭제
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn('[Cache] Del pattern error:', error);
  }
}

/**
 * 콘텐츠 해시 생성 (AI 캐시용)
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Redis 연결 종료 (Upstash REST API는 연결 관리 불필요)
 */
export async function closeRedisConnection(): Promise<void> {
  redisInstance = null;
}

// 캐시 키 프리픽스
export const CACHE_KEYS = {
  API_RESPONSE: 'api:',      // API 응답 캐시
  AI_TAGS: 'ai:tags:',       // AI 태그 캐시
  AI_EMBEDDING: 'ai:emb:',   // AI 임베딩 캐시
} as const;

// 캐시 TTL (초)
export const CACHE_TTL = {
  API_RESPONSE: 60 * 60,          // 1시간
  AI_TAGS: 60 * 60 * 24 * 7,      // 7일
  AI_EMBEDDING: 60 * 60 * 24 * 7, // 7일
} as const;
