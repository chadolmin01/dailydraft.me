/**
 * 동기화 오케스트레이터
 * 여러 소스에서 이벤트를 수집하고 DB에 동기화
 */

import type { TransformedEvent, ProcessedEvent } from '../types/index.js';
import type { SyncResult, FullSyncResult, SyncError } from '../types/sync-result.js';
import { DevpostCollector, type BaseCollector } from '../sources/index.js';
import { classifyEventTags } from '../ai/tag-classifier.js';
import { generateEmbeddingFromEvent } from '../ai/embeddings.js';
import {
  getExistingEventIds,
  insertEventsBatch,
  markExpiredEvents,
} from '../database/index.js';
import { getKSTDate, isExpired } from '../utils/index.js';

export interface SyncOrchestratorConfig {
  enableAI?: boolean;
  maxEventsPerSource?: number;
  skipExisting?: boolean;
}

export class SyncOrchestrator {
  private collectors: BaseCollector[] = [];
  private config: Required<SyncOrchestratorConfig>;

  constructor(config: SyncOrchestratorConfig = {}) {
    this.config = {
      enableAI: config.enableAI ?? true,
      maxEventsPerSource: config.maxEventsPerSource ?? 100,
      skipExisting: config.skipExisting ?? true,
    };

    // 기본 수집기 등록
    this.collectors = [
      new DevpostCollector(),
    ];
  }

  /**
   * 수집기 추가
   */
  addCollector(collector: BaseCollector): void {
    this.collectors.push(collector);
  }

  /**
   * 전체 동기화 실행
   */
  async syncAll(): Promise<FullSyncResult> {
    const startedAt = new Date().toISOString();
    const sourceResults: SyncResult[] = [];

    console.log('='.repeat(50));
    console.log('[Sync] Starting full synchronization...');
    console.log(`[Sync] Collectors: ${this.collectors.map((c) => c.getSource()).join(', ')}`);
    console.log('='.repeat(50));

    // 각 소스에서 수집
    for (const collector of this.collectors) {
      const result = await this.syncSource(collector);
      sourceResults.push(result);
    }

    // 만료된 이벤트 처리
    console.log('\n[Sync] Marking expired events...');
    try {
      const expiredCount = await markExpiredEvents();
      console.log(`[Sync] Marked ${expiredCount} events as expired`);
    } catch (error) {
      console.error('[Sync] Failed to mark expired events:', error);
    }

    const completedAt = new Date().toISOString();

    // 결과 집계
    const result: FullSyncResult = {
      total_new: sourceResults.reduce((sum, r) => sum + r.new_events, 0),
      total_updated: sourceResults.reduce((sum, r) => sum + r.updated_events, 0),
      total_skipped: sourceResults.reduce((sum, r) => sum + r.skipped_events, 0),
      total_errors: sourceResults.reduce((sum, r) => sum + r.errors.length, 0),
      sources: sourceResults,
      started_at: startedAt,
      completed_at: completedAt,
    };

    console.log('\n' + '='.repeat(50));
    console.log('[Sync] Synchronization completed!');
    console.log(`[Sync] New: ${result.total_new}, Skipped: ${result.total_skipped}, Errors: ${result.total_errors}`);
    console.log('='.repeat(50));

    return result;
  }

  /**
   * 단일 소스 동기화
   */
  async syncSource(collector: BaseCollector): Promise<SyncResult> {
    const source = collector.getSource();
    const startedAt = new Date().toISOString();
    const errors: SyncError[] = [];

    console.log(`\n[${source}] Starting sync...`);

    let newEvents = 0;
    let skippedEvents = 0;

    try {
      // 1. 이벤트 수집
      const rawEvents = await collector.collect();
      console.log(`[${source}] Collected ${rawEvents.length} events`);

      // 2. 만료된 이벤트 필터링
      const activeEvents = rawEvents.filter((e) => !isExpired(e.registration_end_date));
      const expiredCount = rawEvents.length - activeEvents.length;
      skippedEvents += expiredCount;
      console.log(`[${source}] Active events: ${activeEvents.length} (${expiredCount} expired)`);

      if (activeEvents.length === 0) {
        return this.createResult(source, 0, 0, skippedEvents, errors, startedAt);
      }

      // 3. 기존 이벤트 확인 (중복 제거)
      if (this.config.skipExisting) {
        const externalIds = activeEvents.map((e) => e.external_id);
        const existingIds = await getExistingEventIds(externalIds);

        const newEventsOnly = activeEvents.filter((e) => !existingIds.has(e.external_id));
        const existingCount = activeEvents.length - newEventsOnly.length;
        skippedEvents += existingCount;

        console.log(`[${source}] New events: ${newEventsOnly.length} (${existingCount} already exist)`);

        if (newEventsOnly.length === 0) {
          return this.createResult(source, 0, 0, skippedEvents, errors, startedAt);
        }

        // 4. AI 처리 (새 이벤트만)
        const processedEvents = await this.processEventsWithAI(newEventsOnly, errors);

        // 5. DB 저장
        const { inserted, errors: insertErrors } = await insertEventsBatch(processedEvents);
        newEvents = inserted;
        errors.push(...insertErrors.map((e) => ({
          ...e,
          source,
          timestamp: new Date().toISOString(),
        })));

        console.log(`[${source}] Inserted ${inserted} events`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({
        source,
        error: `Sync failed: ${message}`,
        timestamp: new Date().toISOString(),
      });
      console.error(`[${source}] Sync failed:`, error);
    }

    // 수집기 에러 추가
    errors.push(...collector.getAndClearErrors());

    return this.createResult(source, newEvents, 0, skippedEvents, errors, startedAt);
  }

  /**
   * AI로 이벤트 처리 (태그 분류 + 임베딩)
   */
  private async processEventsWithAI(
    events: TransformedEvent[],
    errors: SyncError[]
  ): Promise<ProcessedEvent[]> {
    const processed: ProcessedEvent[] = [];

    if (!this.config.enableAI) {
      // AI 비활성화 시 기본값 사용
      return events.map((event) => ({
        ...event,
        interest_tags: this.getDefaultTags(event),
        content_embedding: null,
      }));
    }

    console.log(`[AI] Processing ${events.length} events...`);

    for (const event of events) {
      try {
        // 태그 분류
        const tags = await classifyEventTags(event);

        // 임베딩 생성
        const embedding = await generateEmbeddingFromEvent(event, tags);

        processed.push({
          ...event,
          interest_tags: tags,
          content_embedding: embedding,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push({
          external_id: event.external_id,
          source: event.source,
          error: `AI processing failed: ${message}`,
          timestamp: new Date().toISOString(),
        });

        // 폴백: 기본 태그, 임베딩 없음
        processed.push({
          ...event,
          interest_tags: this.getDefaultTags(event),
          content_embedding: null,
        });
      }
    }

    console.log(`[AI] Processed ${processed.length} events`);
    return processed;
  }

  /**
   * 기본 태그 생성
   */
  private getDefaultTags(event: TransformedEvent): string[] {
    const tags: string[] = ['네트워킹', '청년창업'];

    if (event.source === 'devpost') {
      tags.unshift('AI'); // 해커톤은 주로 AI 관련
    }

    return tags;
  }

  /**
   * SyncResult 생성
   */
  private createResult(
    source: string,
    newEvents: number,
    updatedEvents: number,
    skippedEvents: number,
    errors: SyncError[],
    startedAt: string
  ): SyncResult {
    return {
      source,
      new_events: newEvents,
      updated_events: updatedEvents,
      skipped_events: skippedEvents,
      errors,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    };
  }
}
