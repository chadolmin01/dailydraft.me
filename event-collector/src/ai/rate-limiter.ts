/**
 * Rate Limiter for Gemini API
 * backend/src/lib/ai/rate-limiter.ts 패턴 기반
 */

import { sleep } from '../utils/index.js';

interface QueueItem<T> {
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

class RateLimiter {
  private queue: QueueItem<unknown>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minDelayMs: number;

  constructor(requestsPerMinute: number) {
    // RPM을 ms 딜레이로 변환 (15 RPM = 4000ms)
    this.minDelayMs = Math.ceil(60000 / requestsPerMinute);
  }

  /**
   * 함수 실행 스케줄링
   */
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  /**
   * 큐 처리
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Rate limit 대기
      if (timeSinceLastRequest < this.minDelayMs) {
        const delay = this.minDelayMs - timeSinceLastRequest;
        await sleep(delay);
      }

      const item = this.queue.shift();
      if (!item) break;

      try {
        this.lastRequestTime = Date.now();
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * 현재 큐 크기 반환
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * 큐 초기화
   */
  clear(): void {
    this.queue = [];
    this.processing = false;
  }
}

// Gemini API용 싱글톤 (15 RPM - Free tier)
const rpm = parseInt(process.env.SYNC_RATE_LIMIT_RPM || '15', 10);
export const geminiRateLimiter = new RateLimiter(rpm);
