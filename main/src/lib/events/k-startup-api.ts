/**
 * K-Startup API 클라이언트
 * 정부 공공데이터 포털 (data.go.kr) 창업지원 정보 API
 *
 * 법적 준수 사항:
 * - 공공데이터 포털 이용약관 준수
 * - API 키 기반 인증 사용
 * - Rate limiting 적용
 * - 데이터 출처 명시
 */

import type { KStartupAPIResponse, KStartupAPIOptions, KStartupEventItem } from '@/src/types/startup-events';
import {
  RateLimiter,
  filterPersonalInfo,
  createDataProvenance,
  getLegalHeaders,
} from './legal-compliance';

// K-Startup Open API endpoint
const API_BASE_URL = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Rate limiter (분당 60회 - 공공데이터 포털 기본 제한)
const rateLimiter = new RateLimiter({
  maxRequestsPerMinute: 60,
  minDelayMs: 1000, // 최소 1초 간격
});

/**
 * K-Startup API에서 이벤트 조회 (법적 준수)
 */
export async function fetchKStartupEvents(
  options: Partial<KStartupAPIOptions> = {}
): Promise<KStartupEventItem[]> {
  const serviceKey = process.env.KSTARTUP_API_KEY;

  if (!serviceKey) {
    throw new Error('KSTARTUP_API_KEY is not configured');
  }

  // Rate limiting
  await rateLimiter.waitForSlot();

  const params = new URLSearchParams({
    serviceKey,
    returnType: 'JSON',
    page: String(options.page || 1),
    perPage: String(options.perPage || 100),
  });

  const url = `${API_BASE_URL}?${params.toString()}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...getLegalHeaders('TeamBuilder-Bot/1.0 (+https://teambuilder.kr/bot)'),
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KStartupAPIResponse = await response.json();
      const events = data.data || [];

      // 개인정보 필터링 적용
      return events.map(sanitizeKStartupEvent);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Failed to fetch K-Startup events after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

/**
 * 모든 이벤트 페이지네이션으로 조회
 */
export async function fetchAllKStartupEvents(
  maxPages: number = 10
): Promise<KStartupEventItem[]> {
  // 데이터 출처 기록 (법적 방어)
  const provenance = createDataProvenance(
    API_BASE_URL,
    'K-Startup (공공데이터포털)',
    {
      dataType: 'public_api',
      robotsAllowed: true,
      license: '공공누리 제1유형: 출처표시',
    }
  );
  console.log('[K-Startup] 데이터 출처:', provenance);

  const allEvents: KStartupEventItem[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore && currentPage <= maxPages) {
    try {
      const events = await fetchKStartupEvents({
        page: currentPage,
        perPage: 100,
      });

      allEvents.push(...events);

      hasMore = events.length === 100;
      currentPage++;

    } catch (error) {
      console.error(`[K-Startup] 페이지 ${currentPage} 조회 실패:`, error);
      break;
    }
  }

  console.log(`[K-Startup] 총 ${allEvents.length}개 이벤트 조회 완료`);
  return allEvents;
}

/**
 * K-Startup 이벤트 데이터 정화
 * - 개인정보 필터링
 * - 불필요한 HTML 태그 제거
 */
function sanitizeKStartupEvent(event: KStartupEventItem): KStartupEventItem {
  const sanitized = { ...event };

  // 개인정보가 포함될 수 있는 필드들 필터링
  if (sanitized.pbanc_ctnt) {
    sanitized.pbanc_ctnt = filterPersonalInfo(sanitized.pbanc_ctnt);
  }

  if (sanitized.aply_trgt_ctnt) {
    sanitized.aply_trgt_ctnt = filterPersonalInfo(sanitized.aply_trgt_ctnt);
  }

  if (sanitized.prfn_matr) {
    sanitized.prfn_matr = filterPersonalInfo(sanitized.prfn_matr);
  }

  return sanitized;
}

/**
 * 공공데이터 이용 안내 (법적 고지)
 */
export const DATA_LICENSE = {
  name: '공공누리 제1유형',
  description: '출처표시',
  source: '공공데이터포털 (data.go.kr)',
  provider: '중소벤처기업부',
  attribution: '본 데이터는 공공데이터포털에서 제공하는 K-Startup 창업지원정보를 활용하였습니다.',
  termsUrl: 'https://www.data.go.kr/ugs/selectPortalUseAgrView.do',
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
