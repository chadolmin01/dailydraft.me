/**
 * Rate limiter for Gemini API
 * Free tier: 15 RPM, 1M TPM, 1,500 RPD
 * Strategy: 4 seconds between requests (60s / 15 = 4s)
 */

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
    this.minDelayMs = Math.ceil(60000 / requestsPerMinute);
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject } as QueueItem<unknown>);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

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

  getQueueSize(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
    this.processing = false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export singleton instance for Gemini API (15 RPM)
export const geminiRateLimiter = new RateLimiter(15);
