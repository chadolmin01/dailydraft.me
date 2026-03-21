import type { KStartupEventItem, TransformedEvent } from '@/src/types/startup-events';
import { filterPersonalInfo } from './legal-compliance';

/**
 * Transform K-Startup API response to internal format
 *
 * 법적 준수:
 * - 개인정보 필터링 적용
 * - 원본 URL 보존 (출처 명시)
 * - 메타데이터만 저장 (저작권 보호)
 *
 * API Field Mapping:
 * - pbanc_sn: 공고일련번호 → external_id
 * - biz_pbanc_nm: 사업공고명 → title
 * - pbanc_ntrp_nm: 공고기관명 → organizer
 * - supt_biz_clsfc: 지원사업분류 → event_type
 * - pbanc_ctnt: 공고내용 → description
 * - pbanc_rcpt_bgng_dt: 공고접수시작일자 → registration_start_date
 * - pbanc_rcpt_end_dt: 공고접수종료일자 → registration_end_date
 * - detl_pg_url: 상세페이지URL → registration_url
 */
export function transformKStartupEvent(item: KStartupEventItem): TransformedEvent {
  const eventType = normalizeEventType(item.supt_biz_clsfc);

  // 개인정보 필터링 적용
  const title = filterPersonalInfo(cleanText(item.biz_pbanc_nm));
  const organizer = filterPersonalInfo(cleanText(item.pbanc_ntrp_nm));
  const description = cleanHtml(item.pbanc_ctnt);
  const targetAudience = cleanText(item.aply_trgt);

  return {
    external_id: `k-startup:${item.pbanc_sn}`,
    source: 'k-startup',
    title,
    organizer,
    event_type: eventType,
    description: description ? filterPersonalInfo(description) : null,
    start_date: null,
    end_date: null,
    registration_start_date: parseDate(item.pbanc_rcpt_bgng_dt),
    registration_end_date: parseDate(item.pbanc_rcpt_end_dt) || getTodayISO(),
    registration_url: item.detl_pg_url || item.biz_aply_url || null, // 원본 URL 보존
    views_count: 0,
    target_audience: targetAudience ? filterPersonalInfo(targetAudience) : null,
    // 최소한의 메타데이터만 저장 (저작권 보호)
    raw_data: {
      pbanc_sn: item.pbanc_sn,
      supt_biz_clsfc: item.supt_biz_clsfc,
      supt_regin: item.supt_regin,
      // 전체 원본 데이터는 저장하지 않음
    },
  };
}

/**
 * Parse date string to ISO 8601 format (YYYY-MM-DD)
 * Handles both YYYYMMDD and YYYY-MM-DD formats
 */
function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr) {
    return null;
  }

  // If already in YYYY-MM-DD format
  if (dateStr.includes('-') && dateStr.length === 10) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return dateStr;
    }
  }

  // If in YYYYMMDD format
  if (dateStr.length === 8 && !dateStr.includes('-')) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);

    const date = new Date(`${year}-${month}-${day}`);

    if (!isNaN(date.getTime())) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Get today's date in ISO format
 */
function getTodayISO(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Clean and normalize text
 */
function cleanText(text: string | undefined): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Remove HTML tags and clean content
 */
function cleanHtml(html: string | undefined): string | null {
  if (!html) return null;

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text || null;
}

/**
 * Normalize event type to match database constraints
 * Maps supt_biz_clsfc values to standard types
 */
function normalizeEventType(
  type: string | undefined
): '사업화' | '시설·공간' | '행사·네트워크' | '글로벌' | '창업교육' {
  const normalized = type?.trim() || '';

  // Map variations to standard types
  const typeMap: Record<string, string> = {
    // 사업화 관련
    '사업화': '사업화',
    '사업화지원': '사업화',
    '사업화 지원': '사업화',
    '창업사업화': '사업화',
    'R&D': '사업화',
    '기술개발': '사업화',
    '기술사업화': '사업화',

    // 시설·공간 관련
    '시설공간': '시설·공간',
    '시설·공간': '시설·공간',
    '시설 공간': '시설·공간',
    '공간지원': '시설·공간',
    '입주지원': '시설·공간',

    // 행사·네트워크 관련
    '행사네트워크': '행사·네트워크',
    '행사·네트워크': '행사·네트워크',
    '행사 네트워크': '행사·네트워크',
    '행사': '행사·네트워크',
    '네트워크': '행사·네트워크',
    '멘토링': '행사·네트워크',
    '컨설팅': '행사·네트워크',
    '멘토링ㆍ컨설팅ㆍ교육': '행사·네트워크',
    '멘토링·컨설팅·교육': '행사·네트워크',

    // 글로벌 관련
    '글로벌': '글로벌',
    '글로벌진출': '글로벌',
    '해외진출': '글로벌',
    '수출지원': '글로벌',

    // 창업교육 관련
    '창업교육': '창업교육',
    '교육': '창업교육',
    '창업강좌': '창업교육',
    '교육지원': '창업교육',

    // 기타 지원사업 분류
    '융자': '사업화',
    '투자': '사업화',
    '인력': '사업화',
    '인력지원': '사업화',
    '판로': '사업화',
    '마케팅': '사업화',
  };

  const mapped = typeMap[normalized];

  if (mapped) {
    return mapped as '사업화' | '시설·공간' | '행사·네트워크' | '글로벌' | '창업교육';
  }

  // Check if it contains keywords
  if (normalized.includes('사업화') || normalized.includes('기술')) {
    return '사업화';
  }
  if (normalized.includes('시설') || normalized.includes('공간')) {
    return '시설·공간';
  }
  if (normalized.includes('글로벌') || normalized.includes('해외')) {
    return '글로벌';
  }
  if (normalized.includes('교육')) {
    return '창업교육';
  }

  // Default fallback for unknown event types
  return '행사·네트워크';
}
