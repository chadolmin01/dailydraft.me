import PQueue from 'p-queue';
import { logger } from './logger.js';

const DEFAULT_DELAY_MS = 3000;
const DEFAULT_CONCURRENCY = 2;

export interface RateLimiterOptions {
  delayMs?: number;
  concurrency?: number;
  timeout?: number;
}

export class RateLimiter {
  private queue: PQueue;
  private delayMs: number;
  private lastRequestTime: number = 0;

  constructor(options: RateLimiterOptions = {}) {
    this.delayMs = options.delayMs ?? parseInt(process.env.CRAWL_DELAY_MS || String(DEFAULT_DELAY_MS), 10);
    const concurrency = options.concurrency ?? parseInt(process.env.MAX_CONCURRENT_REQUESTS || String(DEFAULT_CONCURRENCY), 10);

    this.queue = new PQueue({
      concurrency,
      timeout: options.timeout ?? 30000,
      throwOnTimeout: true,
    });

    logger.info(`RateLimiter initialized: delay=${this.delayMs}ms, concurrency=${concurrency}`);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return this.queue.add(async () => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.delayMs) {
        const waitTime = this.delayMs - timeSinceLastRequest;
        await this.sleep(waitTime);
      }

      this.lastRequestTime = Date.now();
      return fn();
    }) as Promise<T>;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get pending(): number {
    return this.queue.pending;
  }

  get size(): number {
    return this.queue.size;
  }

  async onIdle(): Promise<void> {
    return this.queue.onIdle();
  }

  clear(): void {
    this.queue.clear();
  }
}

// Singleton instances per source
const limiters = new Map<string, RateLimiter>();

export function getRateLimiter(source: string, options?: RateLimiterOptions): RateLimiter {
  if (!limiters.has(source)) {
    limiters.set(source, new RateLimiter(options));
  }
  return limiters.get(source)!;
}
