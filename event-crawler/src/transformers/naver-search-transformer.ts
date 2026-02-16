import { RawCrawledEvent, TransformedEvent, EventType } from '../types/index.js';

/**
 * Naver 검색 결과에서 이벤트 타입 추론
 *
 * DB 허용 타입 (기본 5개만 사용 - 마이그레이션 적용 전 호환):
 * - 사업화, 시설·공간, 행사·네트워크, 글로벌, 창업교육
 */
function determineEventType(raw: RawCrawledEvent): EventType {
  // 이미 카테고리가 있으면 매핑
  const categoryMap: Record<string, EventType> = {
    '해커톤': '창업교육',       // 해커톤 → 창업교육
    '창업대회': '사업화',
    '공모전': '사업화',         // 공모전 → 사업화
    '네트워킹': '행사·네트워크',
    '창업지원': '사업화',
    '대외활동': '창업교육',     // 대외활동 → 창업교육
  };

  if (raw.category && categoryMap[raw.category]) {
    return categoryMap[raw.category];
  }

  const text = `${raw.title} ${raw.description || ''} ${raw.tags?.join(' ') || ''}`.toLowerCase();

  // 기본 5개 타입만 사용
  const typeMap: Array<[string[], EventType]> = [
    [['창업대회', '창업경진', '스타트업대회', '창업지원', '지원사업', '육성사업', '액셀러레이터'], '사업화'],
    [['해커톤', 'hackathon', '코딩', '개발대회', '공모전', '콘테스트'], '사업화'],
    [['교육', '캠프', '멘토링', '특강', '세미나', '대외활동', '서포터즈', '기자단'], '창업교육'],
    [['네트워킹', '밋업', '컨퍼런스', '행사', '데모데이'], '행사·네트워크'],
    [['글로벌', '해외', 'global'], '글로벌'],
    [['시설', '공간', '입주', '오피스'], '시설·공간'],
  ];

  for (const [keywords, eventType] of typeMap) {
    if (keywords.some(kw => text.includes(kw))) {
      return eventType;
    }
  }

  return '사업화';  // 기본값
}

/**
 * Transform Naver search event to our format
 */
export function transformNaverSearchEvent(raw: RawCrawledEvent): TransformedEvent | null {
  if (!raw.title || !raw.sourceId) {
    return null;
  }

  // 마감일이 없으면 30일 후로 설정 (임시)
  let registrationEndDate = raw.registrationEndDate;
  if (!registrationEndDate) {
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    registrationEndDate = thirtyDaysLater.toISOString().split('T')[0];
  }

  const now = new Date();
  const endDate = new Date(registrationEndDate);
  const status = endDate < now ? 'expired' : 'active';

  // 소스 타입 결정 (naver-blog, naver-news 등)
  const sourceType = raw.rawData?.type as string || 'naver';

  return {
    external_id: `naver-${sourceType}:${raw.sourceId}`,
    source: 'contestkorea', // DB에는 기존 소스 타입으로 저장 (나중에 'naver' 추가 가능)
    title: raw.title,
    organizer: raw.organizer || '네이버 검색',
    description: raw.description || null,
    event_type: determineEventType(raw),
    start_date: raw.startDate || null,
    end_date: raw.endDate || null,
    registration_start_date: raw.registrationStartDate || null,
    registration_end_date: registrationEndDate,
    registration_url: raw.registrationUrl || raw.sourceUrl || null,
    target_audience: raw.targetAudience || null,
    status,
    raw_data: {
      source_url: raw.sourceUrl,
      search_type: sourceType,
      tags: raw.tags,
      crawled_at: raw.crawledAt,
      original_data: raw.rawData,
    },
  };
}

/**
 * Transform multiple events
 */
export function transformNaverSearchEvents(rawEvents: RawCrawledEvent[]): TransformedEvent[] {
  return rawEvents
    .map(transformNaverSearchEvent)
    .filter((event): event is TransformedEvent => event !== null);
}
