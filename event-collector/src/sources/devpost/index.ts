/**
 * Devpost 수집기
 */

import { BaseCollector, type CollectorConfig } from '../base-collector.js';
import type { TransformedEvent } from '../../types/index.js';
import { fetchAllDevpostHackathons, searchDevpostHackathons } from './api-client.js';
import { transformDevpostHackathons } from './transformer.js';

// 한국/스타트업 관련 검색어
const SEARCH_TERMS = [
  'korea',
  'seoul',
  'startup',
  'AI',
  'fintech',
  'healthtech',
];

export class DevpostCollector extends BaseCollector {
  constructor(config: CollectorConfig = {}) {
    super('devpost', config);
  }

  /**
   * Devpost 해커톤 수집
   */
  async collect(): Promise<TransformedEvent[]> {
    try {
      console.log('[Devpost] Starting collection...');

      // 1. 오픈된 모든 해커톤 조회 (온라인 + 한국)
      const openHackathons = await fetchAllDevpostHackathons({
        maxPages: this.config.maxPages,
        status: 'open',
        includeOnline: true,
      });
      console.log(`[Devpost] Found ${openHackathons.length} open hackathons`);

      // 2. 예정된 해커톤 조회
      const upcomingHackathons = await fetchAllDevpostHackathons({
        maxPages: Math.ceil(this.config.maxPages / 2),
        status: 'upcoming',
        includeOnline: true,
      });
      console.log(`[Devpost] Found ${upcomingHackathons.length} upcoming hackathons`);

      // 3. 키워드 검색으로 추가 수집
      const searchedHackathons = await searchDevpostHackathons(SEARCH_TERMS, {
        status: 'open',
      });
      console.log(`[Devpost] Found ${searchedHackathons.length} hackathons via search`);

      // 중복 제거
      const hackathonMap = new Map<string, typeof openHackathons[0]>();
      for (const h of [...openHackathons, ...upcomingHackathons, ...searchedHackathons]) {
        if (!hackathonMap.has(h.id)) {
          hackathonMap.set(h.id, h);
        }
      }

      const uniqueHackathons = Array.from(hackathonMap.values());
      console.log(`[Devpost] Total unique hackathons: ${uniqueHackathons.length}`);

      // 변환
      const events = transformDevpostHackathons(uniqueHackathons);

      return events;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logError(`Collection failed: ${message}`);
      throw error;
    }
  }

  /**
   * Devpost API 가용성 확인
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch('https://devpost.com/api/hackathons?page=1&per_page=1', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export { fetchDevpostHackathons, fetchAllDevpostHackathons } from './api-client.js';
export { transformDevpostHackathon, transformDevpostHackathons } from './transformer.js';
