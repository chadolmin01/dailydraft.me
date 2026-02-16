/**
 * HTML 및 텍스트 클리닝 유틸리티
 */

import * as cheerio from 'cheerio';

/**
 * HTML 태그 제거 및 엔티티 디코딩
 */
export function cleanHtml(html: string | undefined | null): string | null {
  if (!html) return null;

  // cheerio로 HTML 파싱 및 텍스트 추출
  const $ = cheerio.load(html);
  let text = $.text();

  // HTML 엔티티 디코딩 (cheerio가 처리하지 않는 경우 대비)
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // 연속 공백 정리
  text = text.replace(/\s+/g, ' ').trim();

  return text || null;
}

/**
 * 일반 텍스트 정리
 */
export function cleanText(text: string | undefined | null): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * 설명 텍스트 길이 제한 (DB 저장용)
 */
export function truncateDescription(
  text: string | null,
  maxLength: number = 5000
): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * URL 정규화
 */
export function normalizeUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  let normalized = url.trim();

  // 프로토콜 추가
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  // 유효한 URL인지 확인
  try {
    new URL(normalized);
    return normalized;
  } catch {
    return null;
  }
}

/**
 * 상금 문자열을 숫자로 변환 (원 단위)
 */
export function parsePrizeAmount(prizeStr: string | null): number | null {
  if (!prizeStr) return null;

  // HTML 태그 제거 (Devpost API는 "<span>40,000</span>" 형식으로 반환)
  let cleaned = prizeStr.replace(/<[^>]*>/g, '');

  // 콤마, 공백 제거
  cleaned = cleaned.replace(/[,\s]/g, '');

  // USD: $40000 -> 52,000,000 (1USD = 1300KRW 가정)
  const usdMatch = cleaned.match(/\$(\d+(?:\.\d+)?)/);
  if (usdMatch) {
    const usdAmount = parseFloat(usdMatch[1]);
    return Math.round(usdAmount * 1300);
  }

  // EUR: €10000
  const eurMatch = cleaned.match(/€(\d+(?:\.\d+)?)/);
  if (eurMatch) {
    const eurAmount = parseFloat(eurMatch[1]);
    return Math.round(eurAmount * 1400); // 1EUR ≈ 1400KRW
  }

  // KRW: ₩1000000 or 1000000원
  const krwMatch = cleaned.match(/(?:₩)?(\d+)(?:원)?/);
  if (krwMatch) {
    return parseInt(krwMatch[1], 10);
  }

  return null;
}
