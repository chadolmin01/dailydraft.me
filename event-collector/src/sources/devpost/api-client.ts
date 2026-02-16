/**
 * Devpost API 클라이언트
 * 해커톤 목록 조회용
 */

import type { DevpostHackathon } from '../../types/index.js';
import { sleep, withRetry } from '../../utils/index.js';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '../../cache/index.js';

// Devpost API 엔드포인트 (공개 API)
const DEVPOST_API_BASE = 'https://devpost.com/api/hackathons';

interface DevpostAPIResponse {
  hackathons: DevpostHackathon[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

interface FetchOptions {
  page?: number;
  perPage?: number;
  status?: 'upcoming' | 'open' | 'ended';
  search?: string;
  location?: 'online' | string;
}

/**
 * Devpost 해커톤 목록 조회 (캐시 지원)
 */
export async function fetchDevpostHackathons(
  options: FetchOptions = {}
): Promise<DevpostHackathon[]> {
  const {
    page = 1,
    perPage = 24,
    status = 'open',
    search,
    location,
  } = options;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    status,
  });

  if (search) {
    params.set('search', search);
  }

  if (location) {
    params.set('location', location);
  }

  const url = `${DEVPOST_API_BASE}?${params.toString()}`;

  // 캐시 키 생성
  const cacheKey = `${CACHE_KEYS.API_RESPONSE}devpost:${params.toString()}`;

  // 캐시 확인
  const cached = await cacheGet<DevpostHackathon[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const hackathons = await withRetry(async () => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TeamBuilder-EventCollector/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: DevpostAPIResponse = await response.json();
    return data.hackathons || [];
  });

  // 캐시 저장
  await cacheSet(cacheKey, hackathons, CACHE_TTL.API_RESPONSE);

  return hackathons;
}

/**
 * 모든 오픈 해커톤 조회 (페이지네이션)
 */
export async function fetchAllDevpostHackathons(
  options: {
    maxPages?: number;
    perPage?: number;
    status?: 'upcoming' | 'open';
    includeOnline?: boolean;
  } = {}
): Promise<DevpostHackathon[]> {
  const {
    maxPages = 5,
    perPage = 24,
    status = 'open',
    includeOnline = true,
  } = options;

  const allHackathons: DevpostHackathon[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    const hackathons = await fetchDevpostHackathons({
      page: currentPage,
      perPage,
      status,
    });

    if (hackathons.length === 0) {
      break;
    }

    // 온라인 해커톤 또는 한국 해커톤 필터링
    const filtered = hackathons.filter((h) => {
      const location = h.displayed_location?.location?.toLowerCase() || '';
      const isOnline = location === 'online' || location.includes('virtual');
      const isKorea = location.includes('korea') || location.includes('seoul');

      return includeOnline ? (isOnline || isKorea) : isKorea;
    });

    allHackathons.push(...filtered);

    hasMore = hackathons.length === perPage;
    currentPage++;

    if (hasMore) {
      await sleep(1000); // Rate limiting
    }
  }

  return allHackathons;
}

/**
 * 검색어 기반 해커톤 조회
 */
export async function searchDevpostHackathons(
  searchTerms: string[],
  options: {
    maxPages?: number;
    status?: 'upcoming' | 'open';
  } = {}
): Promise<DevpostHackathon[]> {
  const allHackathons: DevpostHackathon[] = [];
  const seenIds = new Set<string>();

  for (const term of searchTerms) {
    const hackathons = await fetchDevpostHackathons({
      search: term,
      status: options.status || 'open',
      page: 1,
      perPage: 24,
    });

    for (const h of hackathons) {
      if (!seenIds.has(h.id)) {
        seenIds.add(h.id);
        allHackathons.push(h);
      }
    }

    await sleep(1000); // Rate limiting between searches
  }

  return allHackathons;
}
