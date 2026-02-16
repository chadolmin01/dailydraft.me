/**
 * 추상 베이스 수집기 클래스
 */

import type { TransformedEvent, EventSource } from '../types/index.js';
import type { SyncResult, SyncError } from '../types/sync-result.js';

export interface CollectorConfig {
  maxPages?: number;
  rateLimitRpm?: number;
  timeout?: number;
}

export abstract class BaseCollector {
  protected readonly source: EventSource;
  protected readonly config: Required<CollectorConfig>;
  protected errors: SyncError[] = [];

  constructor(source: EventSource, config: CollectorConfig = {}) {
    this.source = source;
    this.config = {
      maxPages: config.maxPages ?? 10,
      rateLimitRpm: config.rateLimitRpm ?? 60,
      timeout: config.timeout ?? 30000,
    };
  }

  /**
   * 이벤트 수집 (서브클래스에서 구현)
   */
  abstract collect(): Promise<TransformedEvent[]>;

  /**
   * 소스 가용성 확인
   */
  abstract checkAvailability(): Promise<boolean>;

  /**
   * 소스 이름 반환
   */
  getSource(): EventSource {
    return this.source;
  }

  /**
   * 에러 기록
   */
  protected logError(error: string, externalId?: string): void {
    this.errors.push({
      external_id: externalId,
      source: this.source,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 누적된 에러 반환 및 초기화
   */
  getAndClearErrors(): SyncError[] {
    const errors = [...this.errors];
    this.errors = [];
    return errors;
  }

  /**
   * Rate limit 지연 계산 (ms)
   */
  protected getRateLimitDelay(): number {
    return Math.ceil(60000 / this.config.rateLimitRpm);
  }
}
