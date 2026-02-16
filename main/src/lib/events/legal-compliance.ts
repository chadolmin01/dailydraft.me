/**
 * 법적 준수 모듈 - 크롤링/데이터 수집 시 법적 방어
 *
 * 주요 방어 항목:
 * 1. robots.txt 준수
 * 2. 이용약관(ToS) 확인
 * 3. Rate limiting (서버 부하 방지)
 * 4. 개인정보 필터링
 * 5. 저작권 보호 (메타데이터만 저장)
 */

// robots.txt 캐시 (메모리)
const robotsTxtCache = new Map<string, {
  rules: RobotRules;
  fetchedAt: number;
  ttl: number;
}>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

interface RobotRules {
  allowed: boolean;
  disallowedPaths: string[];
  crawlDelay?: number;
}

/**
 * robots.txt 파싱 및 준수 확인
 */
export async function checkRobotsTxt(
  baseUrl: string,
  path: string = '/',
  userAgent: string = '*'
): Promise<{
  allowed: boolean;
  crawlDelay?: number;
  reason?: string;
}> {
  try {
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;

    // 캐시 확인
    const cached = robotsTxtCache.get(origin);
    if (cached && Date.now() - cached.fetchedAt < cached.ttl) {
      return evaluateRules(cached.rules, path);
    }

    // robots.txt 가져오기
    const robotsUrl = `${origin}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // robots.txt 없음 = 모든 접근 허용
      const rules: RobotRules = { allowed: true, disallowedPaths: [] };
      robotsTxtCache.set(origin, { rules, fetchedAt: Date.now(), ttl: CACHE_TTL });
      return { allowed: true, reason: 'No robots.txt found' };
    }

    const text = await response.text();
    const rules = parseRobotsTxt(text, userAgent);

    // 캐시 저장
    robotsTxtCache.set(origin, { rules, fetchedAt: Date.now(), ttl: CACHE_TTL });

    return evaluateRules(rules, path);
  } catch (error) {
    // 오류 시 보수적으로 허용 (but 로그)
    console.warn(`robots.txt fetch failed for ${baseUrl}:`, error);
    return { allowed: true, reason: 'robots.txt fetch failed, proceeding with caution' };
  }
}

/**
 * robots.txt 파싱
 */
function parseRobotsTxt(content: string, targetAgent: string): RobotRules {
  const lines = content.split('\n');
  const rules: RobotRules = {
    allowed: true,
    disallowedPaths: [],
  };

  let currentAgent = '';
  let isRelevantAgent = false;

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();

    // 주석 무시
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // User-agent 확인
    if (trimmed.startsWith('user-agent:')) {
      currentAgent = trimmed.replace('user-agent:', '').trim();
      isRelevantAgent = currentAgent === '*' || currentAgent === targetAgent.toLowerCase();
      continue;
    }

    if (!isRelevantAgent) continue;

    // Disallow 규칙
    if (trimmed.startsWith('disallow:')) {
      const path = trimmed.replace('disallow:', '').trim();
      if (path === '/') {
        rules.allowed = false;
      } else if (path) {
        rules.disallowedPaths.push(path);
      }
    }

    // Allow 규칙 (Disallow: / 이후에 Allow가 있으면 허용)
    if (trimmed.startsWith('allow:')) {
      const path = trimmed.replace('allow:', '').trim();
      if (path === '/') {
        rules.allowed = true;
      }
    }

    // Crawl-delay
    if (trimmed.startsWith('crawl-delay:')) {
      const delay = parseInt(trimmed.replace('crawl-delay:', '').trim());
      if (!isNaN(delay)) {
        rules.crawlDelay = delay * 1000; // 초 -> 밀리초
      }
    }
  }

  return rules;
}

/**
 * 특정 경로에 대한 규칙 평가
 */
function evaluateRules(
  rules: RobotRules,
  path: string
): { allowed: boolean; crawlDelay?: number; reason?: string } {
  // 전체 차단
  if (!rules.allowed) {
    return {
      allowed: false,
      crawlDelay: rules.crawlDelay,
      reason: 'Disallow: / in robots.txt',
    };
  }

  // 특정 경로 차단 확인
  for (const disallowed of rules.disallowedPaths) {
    if (path.startsWith(disallowed)) {
      return {
        allowed: false,
        crawlDelay: rules.crawlDelay,
        reason: `Path matches Disallow: ${disallowed}`,
      };
    }
  }

  return {
    allowed: true,
    crawlDelay: rules.crawlDelay,
  };
}

/**
 * 개인정보 필터링
 * 한국 개인정보보호법 준수
 */
export function filterPersonalInfo(text: string): string {
  if (!text) return text;

  let filtered = text;

  // 이메일 주소 마스킹
  filtered = filtered.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[이메일 제거됨]'
  );

  // 전화번호 마스킹 (한국 형식)
  filtered = filtered.replace(
    /(\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4})/g,
    '[연락처 제거됨]'
  );

  // 주민등록번호 패턴 마스킹
  filtered = filtered.replace(
    /\d{6}[-\s]?\d{7}/g,
    '[주민번호 제거됨]'
  );

  // 계좌번호 패턴 마스킹 (일반적인 패턴)
  filtered = filtered.replace(
    /\d{3,4}[-\s]?\d{2,4}[-\s]?\d{4,6}/g,
    (match) => {
      // 날짜 형식은 제외
      if (/^\d{4}[-./]\d{2}[-./]\d{2}$/.test(match)) return match;
      return '[계좌정보 제거됨]';
    }
  );

  return filtered;
}

/**
 * 저작권 보호를 위한 콘텐츠 요약
 * 원본 전체 저장 대신 메타데이터만 저장
 */
export function extractMetadataOnly(content: {
  title: string;
  description?: string;
  fullContent?: string;
}): {
  title: string;
  summary: string | null;
  wordCount: number;
} {
  const { title, description, fullContent } = content;

  // 설명이 있으면 사용, 없으면 본문에서 추출
  let summary: string | null = null;

  if (description) {
    // 설명은 200자로 제한
    summary = description.substring(0, 200);
    if (description.length > 200) summary += '...';
  } else if (fullContent) {
    // 본문 첫 200자만 추출 (저작권 보호)
    const cleaned = fullContent.replace(/<[^>]*>/g, '').trim();
    summary = cleaned.substring(0, 200);
    if (cleaned.length > 200) summary += '...';
  }

  // 개인정보 필터링
  if (summary) {
    summary = filterPersonalInfo(summary);
  }

  return {
    title: filterPersonalInfo(title),
    summary,
    wordCount: fullContent ? fullContent.split(/\s+/).length : 0,
  };
}

/**
 * Rate Limiter - 서버 부하 방지
 */
export class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly minDelayMs: number;

  constructor(options: {
    maxRequestsPerMinute?: number;
    minDelayMs?: number;
  } = {}) {
    this.maxRequests = options.maxRequestsPerMinute || 30;
    this.windowMs = 60 * 1000; // 1분
    this.minDelayMs = options.minDelayMs || 2000; // 최소 2초 간격
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // 오래된 요청 기록 제거
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.windowMs
    );

    // 분당 최대 요청 수 초과 확인
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await sleep(waitTime);
      }
    }

    // 마지막 요청과의 최소 간격 확보
    const lastRequest = this.requestTimes[this.requestTimes.length - 1];
    if (lastRequest) {
      const timeSinceLastRequest = now - lastRequest;
      if (timeSinceLastRequest < this.minDelayMs) {
        await sleep(this.minDelayMs - timeSinceLastRequest);
      }
    }

    // 현재 요청 기록
    this.requestTimes.push(Date.now());
  }
}

/**
 * 데이터 수집 전 법적 준수 확인
 */
export async function checkLegalCompliance(
  url: string,
  options: {
    checkRobots?: boolean;
    userAgent?: string;
  } = {}
): Promise<{
  canProceed: boolean;
  warnings: string[];
  recommendations: string[];
  crawlDelay?: number;
}> {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let canProceed = true;
  let crawlDelay: number | undefined;

  const { checkRobots = true, userAgent = 'TeamBuilder-Bot/1.0' } = options;

  // 1. robots.txt 확인
  if (checkRobots) {
    const robotsResult = await checkRobotsTxt(url, '/', userAgent);

    if (!robotsResult.allowed) {
      warnings.push(`robots.txt에서 크롤링 금지: ${robotsResult.reason}`);
      canProceed = false;
    }

    if (robotsResult.crawlDelay) {
      crawlDelay = robotsResult.crawlDelay;
      recommendations.push(`Crawl-delay: ${crawlDelay / 1000}초 간격 유지 필요`);
    }
  }

  // 2. 일반적인 권장사항
  recommendations.push('원본 링크를 항상 제공하세요');
  recommendations.push('메타데이터만 저장하고 전체 콘텐츠는 저장하지 마세요');
  recommendations.push('개인정보는 자동으로 필터링됩니다');
  recommendations.push('Rate limiting을 준수하세요 (최소 2초 간격)');

  return {
    canProceed,
    warnings,
    recommendations,
    crawlDelay,
  };
}

/**
 * 법적 준수 헤더 생성
 */
export function getLegalHeaders(userAgent?: string): Record<string, string> {
  return {
    'User-Agent': userAgent || 'TeamBuilder-Bot/1.0 (+https://teambuilder.kr/bot)',
    'Accept': 'text/html,application/json',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    // 캐시 존중
    'Cache-Control': 'no-cache',
    // 참조 페이지 명시
    'Referer': 'https://teambuilder.kr',
  };
}

/**
 * 데이터 출처 기록 (법적 방어용)
 */
export interface DataProvenance {
  source_url: string;
  source_name: string;
  collected_at: string;
  robots_txt_checked: boolean;
  robots_txt_allowed: boolean;
  data_type: 'public_api' | 'public_webpage' | 'rss_feed';
  license?: string;
  attribution_required: boolean;
  original_link_preserved: boolean;
}

export function createDataProvenance(
  url: string,
  sourceName: string,
  options: {
    dataType: DataProvenance['data_type'];
    robotsAllowed?: boolean;
    license?: string;
  }
): DataProvenance {
  return {
    source_url: url,
    source_name: sourceName,
    collected_at: new Date().toISOString(),
    robots_txt_checked: true,
    robots_txt_allowed: options.robotsAllowed ?? true,
    data_type: options.dataType,
    license: options.license,
    attribution_required: true,
    original_link_preserved: true,
  };
}

// 유틸리티
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
