/**
 * Naver Search API Crawler (강화 버전)
 *
 * 기능:
 * - 블로그/뉴스/카페 통합 검색
 * - 마감일 스마트 파싱
 * - 실제 이벤트 URL 추출
 * - 중복 이벤트 병합
 * - 후기/광고 필터링
 *
 * API: https://developers.naver.com/docs/search/blog/
 * 할당량: 25,000 calls/day (무료)
 */

import { BaseCrawler } from './base-crawler.js';
import { RawCrawledEvent, CrawlOptions } from '../types/index.js';
import { cacheManager } from '../utils/cache.js';

const NAVER_API_URL = 'https://openapi.naver.com/v1/search';

// 검색 키워드 (우선순위 순)
const SEARCH_KEYWORDS = [
  // 핵심 키워드
  '해커톤 모집 2024',
  '해커톤 참가자 모집',
  '창업대회 공고 2024',
  '창업경진대회 모집',
  '공모전 접수 2024',
  '아이디어 공모전 모집',
  // 세부 키워드
  '스타트업 밋업',
  'IT 공모전 접수',
  '대학생 공모전 모집',
  '창업지원사업 모집',
  '액셀러레이터 모집',
  '데모데이 참가',
];

// 검색 타입
type SearchType = 'blog' | 'news' | 'cafearticle';

interface NaverSearchItem {
  title: string;
  link: string;
  description: string;
  bloggername?: string;
  bloggerlink?: string;
  postdate?: string;         // YYYYMMDD
  originallink?: string;
  pubDate?: string;          // RFC 2822
  cafename?: string;
  cafeurl?: string;
}

interface NaverSearchResponse {
  total: number;
  start: number;
  display: number;
  items: NaverSearchItem[];
}

// 추출된 이벤트 정보
interface ExtractedEventInfo {
  title: string;
  description: string;
  deadline: string | null;
  registrationUrl: string | null;
  organizer: string | null;
  prize: string | null;
  eventType: string | null;
}

export class NaverSearchCrawler extends BaseCrawler {
  private clientId: string | null;
  private clientSecret: string | null;

  constructor() {
    super('contestkorea', NAVER_API_URL);
    this.clientId = process.env.NAVER_CLIENT_ID || null;
    this.clientSecret = process.env.NAVER_CLIENT_SECRET || null;
  }

  isAvailable(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  async getEventList(options: CrawlOptions = {}): Promise<string[]> {
    // 이 크롤러는 searchEvents()를 직접 사용
    return [];
  }

  async crawlEventPage(url: string): Promise<RawCrawledEvent | null> {
    return null;
  }

  /**
   * 메인 검색 함수 - 블로그/뉴스/카페 통합 검색
   */
  async searchEvents(options: CrawlOptions = {}): Promise<RawCrawledEvent[]> {
    if (!this.isAvailable()) {
      this.logger.error('Naver API credentials not configured');
      return [];
    }

    const allEvents: RawCrawledEvent[] = [];
    const maxResults = options.maxPages ?? 20;
    const searchTypes: SearchType[] = ['blog', 'news', 'cafearticle'];
    const skipCache = options.verbose || false; // verbose 모드에서는 캐시 무시

    // 캐시 상태 로그
    if (cacheManager.isAvailable()) {
      const stats = await cacheManager.getStats();
      this.logger.info(`Cache enabled - URLs: ${stats?.urls || 0}, Searches: ${stats?.searches || 0}`);
    } else {
      this.logger.info('Cache not available - running without cache');
    }

    let cacheHits = 0;
    let apiCalls = 0;

    for (const keyword of SEARCH_KEYWORDS) {
      for (const searchType of searchTypes) {
        try {
          // 1. 검색 결과 캐시 확인
          let items: NaverSearchItem[] | null = null;

          if (!skipCache) {
            items = await cacheManager.getSearchResult<NaverSearchItem[]>(keyword, searchType);
            if (items) {
              cacheHits++;
            }
          }

          // 2. 캐시 미스 시 API 호출
          if (!items) {
            items = await this.rateLimiter.execute(() =>
              this.search(searchType, keyword, maxResults)
            );
            apiCalls++;

            // 검색 결과 캐시 저장
            if (items.length > 0) {
              await cacheManager.setSearchResult(keyword, searchType, items);
            }

            // Rate limiting (API 호출 시에만)
            await this.sleep(50);
          }

          // 3. 이미 처리된 URL 필터링
          const urls = items.map(item => item.originallink || item.link);
          const uncrawledUrls = skipCache
            ? urls
            : await cacheManager.filterUncrawledUrls(urls);

          const uncrawledSet = new Set(uncrawledUrls);
          const newItems = items.filter(item => {
            const url = item.originallink || item.link;
            return uncrawledSet.has(url);
          });

          for (const item of newItems) {
            // 필터링 - 이벤트 관련 + 후기/광고 제외
            if (!this.isValidEvent(item)) continue;

            // 상세 정보 추출
            const eventInfo = this.extractEventInfo(item);

            // RawCrawledEvent 생성
            const event = this.createEventFromItem(item, searchType, eventInfo);
            if (event) {
              allEvents.push(event);
            }
          }

          // 4. 처리된 URL 캐시에 마킹
          if (uncrawledUrls.length > 0) {
            await cacheManager.markUrlsCrawled(uncrawledUrls);
          }
        } catch (error) {
          this.logger.error(`Search error [${searchType}/${keyword}]: ${(error as Error).message}`);
        }
      }
    }

    // 5. 중복 제거 및 병합
    const uniqueEvents = this.deduplicateAndMerge(allEvents);

    this.logger.info(`Found ${uniqueEvents.length} unique events from Naver search`, {
      cacheHits,
      apiCalls,
      totalSearches: SEARCH_KEYWORDS.length * searchTypes.length,
    });

    return uniqueEvents;
  }

  /**
   * Naver API 검색
   */
  private async search(type: SearchType, query: string, display: number = 20): Promise<NaverSearchItem[]> {
    const url = new URL(`${NAVER_API_URL}/${type}.json`);
    url.searchParams.set('query', query);
    url.searchParams.set('display', String(Math.min(display, 100)));
    url.searchParams.set('sort', 'date');

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': this.clientId!,
        'X-Naver-Client-Secret': this.clientSecret!,
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API error ${response.status}`);
    }

    const data = await response.json() as NaverSearchResponse;
    return data.items || [];
  }

  /**
   * 유효한 이벤트인지 필터링
   */
  private isValidEvent(item: NaverSearchItem): boolean {
    const text = this.stripHtml(`${item.title} ${item.description}`).toLowerCase();

    // 필수 키워드 (하나 이상 포함)
    const requiredKeywords = [
      '모집', '접수', '공모', '참가', '신청', '지원',
      '마감', '선발', '공고', '개최',
    ];

    // 제외 키워드 (포함시 제외)
    const excludeKeywords = [
      '후기', '리뷰', '수상작', '결과발표', '당선작', '수상자',
      '참가후기', '참여후기', '다녀왔', '다녀옴',
      '광고', '협찬', '체험단',
      '마감되었', '마감됐', '종료',
    ];

    const hasRequired = requiredKeywords.some(kw => text.includes(kw));
    const hasExcluded = excludeKeywords.some(kw => text.includes(kw));

    return hasRequired && !hasExcluded;
  }

  /**
   * 검색 결과에서 이벤트 정보 추출
   */
  private extractEventInfo(item: NaverSearchItem): ExtractedEventInfo {
    const title = this.stripHtml(item.title);
    const description = this.stripHtml(item.description);
    const fullText = `${title} ${description}`;

    return {
      title: this.cleanEventTitle(title),
      description,
      deadline: this.extractDeadline(fullText),
      registrationUrl: this.extractEventUrl(fullText, item.link),
      organizer: this.extractOrganizer(fullText),
      prize: this.extractPrize(fullText),
      eventType: this.detectEventType(fullText),
    };
  }

  /**
   * 마감일 추출 (다양한 패턴 지원)
   */
  private extractDeadline(text: string): string | null {
    const now = new Date();
    const currentYear = now.getFullYear();

    // 패턴 우선순위대로 시도
    const patterns: Array<{ regex: RegExp; parse: (match: RegExpMatchArray) => string | null }> = [
      // ~2/28, ~02/28, ~2.28
      {
        regex: /[~까지]\s*(\d{1,2})[.\/](\d{1,2})(?!\d)/,
        parse: (m) => {
          const month = parseInt(m[1], 10);
          const day = parseInt(m[2], 10);
          const year = month < now.getMonth() + 1 ? currentYear + 1 : currentYear;
          return this.formatDate(year, month, day);
        },
      },
      // 2024.02.28, 2024/02/28, 2024-02-28
      {
        regex: /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/,
        parse: (m) => this.formatDate(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)),
      },
      // 2월 28일, 02월 28일
      {
        regex: /(\d{1,2})월\s*(\d{1,2})일/,
        parse: (m) => {
          const month = parseInt(m[1], 10);
          const day = parseInt(m[2], 10);
          const year = month < now.getMonth() + 1 ? currentYear + 1 : currentYear;
          return this.formatDate(year, month, day);
        },
      },
      // D-7, D-14
      {
        regex: /D-(\d{1,3})/i,
        parse: (m) => {
          const days = parseInt(m[1], 10);
          const deadline = new Date(now);
          deadline.setDate(deadline.getDate() + days);
          return deadline.toISOString().split('T')[0];
        },
      },
      // 마감: 2월 28일
      {
        regex: /마감[:\s]*(\d{1,2})[.\/-](\d{1,2})/,
        parse: (m) => {
          const month = parseInt(m[1], 10);
          const day = parseInt(m[2], 10);
          const year = month < now.getMonth() + 1 ? currentYear + 1 : currentYear;
          return this.formatDate(year, month, day);
        },
      },
    ];

    for (const { regex, parse } of patterns) {
      const match = text.match(regex);
      if (match) {
        const result = parse(match);
        if (result && this.isValidDeadline(result)) {
          return result;
        }
      }
    }

    return null;
  }

  /**
   * 날짜 포맷팅
   */
  private formatDate(year: number, month: number, day: number): string | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * 유효한 마감일인지 확인 (과거 날짜 제외)
   */
  private isValidDeadline(dateStr: string): boolean {
    const deadline = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return deadline >= now;
  }

  /**
   * 실제 이벤트 URL 추출
   */
  private extractEventUrl(text: string, fallbackUrl: string): string {
    // 공식 사이트 URL 패턴
    const urlPatterns = [
      /https?:\/\/[^\s<>"]*(?:apply|register|signup|form|recruit|공모|접수)[^\s<>"]*/gi,
      /https?:\/\/(?:docs\.google\.com|forms\.gle|notion\.so|event)[^\s<>"]*/gi,
      /https?:\/\/[^\s<>"]*(?:k-startup|kstartup|창업진흥원|소상공인)[^\s<>"]*/gi,
    ];

    for (const pattern of urlPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return fallbackUrl;
  }

  /**
   * 주최자 추출
   */
  private extractOrganizer(text: string): string | null {
    const patterns = [
      /주최[:\s]*([가-힣A-Za-z0-9]+(?:[\s·,][가-힣A-Za-z0-9]+)*)/,
      /주관[:\s]*([가-힣A-Za-z0-9]+(?:[\s·,][가-힣A-Za-z0-9]+)*)/,
      /([가-힣]+(?:부|청|원|진흥원|재단|협회|센터))/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().slice(0, 50);
      }
    }

    return null;
  }

  /**
   * 상금 추출
   */
  private extractPrize(text: string): string | null {
    const patterns = [
      /(?:상금|시상|총\s*)?(\d{1,3}(?:,\d{3})*)\s*만?\s*원/,
      /(?:대상|1등|최우수)\s*[:"]?\s*(\d{1,3}(?:,\d{3})*)\s*만?\s*원/,
      /총\s*상금\s*(\d+(?:억|천만|백만)?)/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * 이벤트 타입 감지
   */
  private detectEventType(text: string): string | null {
    const typeMap: Array<[string[], string]> = [
      [['해커톤', 'hackathon', '코딩대회', '개발대회'], '해커톤'],
      [['창업대회', '창업경진', '비즈니스대회', '스타트업대회'], '창업대회'],
      [['공모전', '콘테스트', '공모'], '공모전'],
      [['밋업', '네트워킹', '컨퍼런스', '세미나'], '네트워킹'],
      [['액셀러레이터', '지원사업', '육성'], '창업지원'],
      [['대외활동', '서포터즈', '기자단'], '대외활동'],
    ];

    const lowerText = text.toLowerCase();
    for (const [keywords, type] of typeMap) {
      if (keywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
        return type;
      }
    }

    return null;
  }

  /**
   * 이벤트 제목 정리
   */
  private cleanEventTitle(title: string): string {
    return title
      .replace(/\[.*?\]/g, '')  // [태그] 제거
      .replace(/【.*?】/g, '')  // 【태그】 제거
      .replace(/^\s*[-·]\s*/, '') // 앞 기호 제거
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  }

  /**
   * HTML 태그 제거
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  /**
   * RawCrawledEvent 생성
   */
  private createEventFromItem(
    item: NaverSearchItem,
    type: SearchType,
    info: ExtractedEventInfo
  ): RawCrawledEvent | null {
    if (!info.title) return null;

    const url = item.originallink || item.link;
    const sourceId = `naver-${type}-${this.hashString(url)}`;

    // 게시일 파싱
    let publishDate: string | undefined;
    if (item.postdate) {
      const d = item.postdate;
      publishDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    } else if (item.pubDate) {
      publishDate = new Date(item.pubDate).toISOString().split('T')[0];
    }

    return this.createRawEvent({
      sourceId,
      sourceUrl: url,
      title: info.title,
      description: info.description,
      organizer: info.organizer || item.bloggername || item.cafename,
      registrationEndDate: info.deadline || undefined,
      registrationUrl: info.registrationUrl || url,
      prize: info.prize || undefined,
      category: info.eventType || undefined,
      tags: [
        `naver-${type}`,
        info.eventType || 'unknown',
      ].filter(Boolean) as string[],
      rawData: {
        searchType: type,
        publishDate,
        originalItem: item,
      },
    });
  }

  /**
   * 중복 제거 및 병합
   */
  private deduplicateAndMerge(events: RawCrawledEvent[]): RawCrawledEvent[] {
    const eventMap = new Map<string, RawCrawledEvent>();

    for (const event of events) {
      // 정규화된 키 생성 (제목에서 공백/특수문자 제거)
      const key = this.normalizeTitle(event.title);

      const existing = eventMap.get(key);
      if (!existing) {
        eventMap.set(key, event);
      } else {
        // 기존 이벤트와 병합 (더 많은 정보 보존)
        eventMap.set(key, this.mergeEvents(existing, event));
      }
    }

    return Array.from(eventMap.values());
  }

  /**
   * 제목 정규화 (중복 체크용)
   */
  private normalizeTitle(title: string): string {
    return title
      .replace(/[^가-힣a-zA-Z0-9]/g, '')
      .toLowerCase()
      .slice(0, 30);
  }

  /**
   * 이벤트 병합 (더 많은 정보 보존)
   */
  private mergeEvents(a: RawCrawledEvent, b: RawCrawledEvent): RawCrawledEvent {
    return {
      ...a,
      // 마감일: 둘 중 있는 것
      registrationEndDate: a.registrationEndDate || b.registrationEndDate,
      // 설명: 더 긴 것
      description: (a.description?.length || 0) > (b.description?.length || 0)
        ? a.description
        : b.description,
      // 주최자: 있는 것
      organizer: a.organizer || b.organizer,
      // 상금: 있는 것
      prize: a.prize || b.prize,
      // URL: 공식 URL 우선
      registrationUrl: this.preferOfficialUrl(a.registrationUrl, b.registrationUrl),
      // 태그: 합치기
      tags: [...new Set([...(a.tags || []), ...(b.tags || [])])],
    };
  }

  /**
   * 공식 URL 우선 선택
   */
  private preferOfficialUrl(a?: string, b?: string): string | undefined {
    const officialDomains = ['go.kr', 'or.kr', 'k-startup', 'google.com/forms', 'notion'];

    for (const url of [a, b]) {
      if (url && officialDomains.some(d => url.includes(d))) {
        return url;
      }
    }

    return a || b;
  }

  /**
   * 문자열 해시
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).slice(0, 12);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
