/**
 * Event Collector Module
 * 스타트업 행사 수집 모듈
 */

// Types
export * from './types/index.js';

// Sources
export { DevpostCollector, MeetupCollector, BaseCollector } from './sources/index.js';

// AI
export {
  classifyEventTags,
  generateEventEmbedding,
  AVAILABLE_TAGS,
} from './ai/index.js';

// Database
export {
  getSupabaseClient,
  getExistingEventIds,
  insertEventsBatch,
  markExpiredEvents,
  getEventCountBySource,
} from './database/index.js';

// Sync
export { SyncOrchestrator, type SyncOrchestratorConfig } from './sync/index.js';

// Utils
export {
  getKSTDate,
  parseDate,
  cleanHtml,
  cleanText,
  sleep,
  withRetry,
} from './utils/index.js';

/**
 * 전체 동기화 실행 (편의 함수)
 */
export async function runFullSync(options?: {
  enableAI?: boolean;
}): Promise<import('./types/index.js').FullSyncResult> {
  const { SyncOrchestrator } = await import('./sync/index.js');

  const orchestrator = new SyncOrchestrator({
    enableAI: options?.enableAI ?? true,
  });

  return orchestrator.syncAll();
}
