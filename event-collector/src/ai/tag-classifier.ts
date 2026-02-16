/**
 * AI 태그 분류기
 * backend/src/lib/ai/event-tag-classifier.ts 패턴 기반
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TransformedEvent } from '../types/index.js';
import { geminiRateLimiter } from './rate-limiter.js';
import {
  cacheGet,
  cacheSet,
  generateContentHash,
  CACHE_KEYS,
  CACHE_TTL,
} from '../cache/index.js';

// 사용 가능한 태그 목록
export const AVAILABLE_TAGS = [
  // 분야
  'AI', '핀테크', '헬스케어', '에듀테크', '푸드테크', '이커머스', '게임', '콘텐츠', '하드웨어', '친환경', '바이오',
  // 단계
  '아이디어', '초기창업', '시리즈A', '시리즈B', '성장기',
  // 특성
  '딥테크', '소셜임팩트', '글로벌', '지역특화',
  // 대상
  '청년창업', '여성창업', '시니어창업', '대학생창업',
  // 지원 유형
  '투자유치', '멘토링', '공간지원', '교육프로그램', '네트워킹',
] as const;

export type EventTag = (typeof AVAILABLE_TAGS)[number];

/**
 * 이벤트 태그 분류 (캐시 지원)
 */
export async function classifyEventTags(
  event: TransformedEvent
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI] GEMINI_API_KEY not set, using fallback tags');
    return getFallbackTags(event);
  }

  // 캐시 키 생성 (제목 + 설명 해시)
  const contentForHash = `${event.title}|${event.organizer}|${event.description || ''}`;
  const hash = generateContentHash(contentForHash);
  const cacheKey = `${CACHE_KEYS.AI_TAGS}${hash}`;

  // 캐시 확인
  const cachedTags = await cacheGet<string[]>(cacheKey);
  if (cachedTags) {
    return cachedTags;
  }

  try {
    const tags = await geminiRateLimiter.schedule(async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = buildClassificationPrompt(event);
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      return parseTagsFromResponse(response);
    });

    // 캐시 저장
    await cacheSet(cacheKey, tags, CACHE_TTL.AI_TAGS);

    return tags;
  } catch (error) {
    console.warn('[AI] Tag classification failed, using fallback:', error);
    return getFallbackTags(event);
  }
}

/**
 * 분류 프롬프트 생성
 */
function buildClassificationPrompt(event: TransformedEvent): string {
  return `당신은 창업 지원 프로그램 분류 전문가입니다. 주어진 이벤트 정보를 분석하여 관련 태그를 추출하세요.

가능한 태그 목록:
${AVAILABLE_TAGS.join(', ')}

이벤트 정보:
제목: ${event.title}
주최: ${event.organizer}
유형: ${event.event_type}
설명: ${event.description?.substring(0, 500) || '설명 없음'}
소스: ${event.source}
위치: ${event.location || '미정'}

규칙:
1. 이벤트와 관련성이 높은 태그만 선택하세요
2. 3-7개의 태그를 선택하세요
3. JSON 배열 형식으로만 반환하세요 (다른 설명 없이)
4. 예시: ["AI", "딥테크", "투자유치", "청년창업"]

태그 배열:`;
}

/**
 * AI 응답에서 태그 파싱
 */
function parseTagsFromResponse(response: string): string[] {
  // JSON 블록 추출
  const cleaned = response
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  const match = cleaned.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error('No JSON array found in response');
  }

  const tags: unknown = JSON.parse(match[0]);

  if (!Array.isArray(tags)) {
    throw new Error('Response is not an array');
  }

  // 유효한 태그만 필터링
  const validTags = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .filter((tag) => AVAILABLE_TAGS.includes(tag as EventTag))
    .slice(0, 7);

  if (validTags.length < 3) {
    throw new Error(`Too few valid tags: ${validTags.length}`);
  }

  return validTags;
}

/**
 * 폴백 태그 생성
 */
function getFallbackTags(event: TransformedEvent): string[] {
  const tags: string[] = [];

  // 이벤트 유형 기반 기본 태그
  switch (event.event_type) {
    case '사업화':
      tags.push('투자유치', '초기창업');
      break;
    case '시설·공간':
      tags.push('공간지원', '초기창업');
      break;
    case '행사·네트워크':
      tags.push('네트워킹', '교육프로그램');
      break;
    case '글로벌':
      tags.push('글로벌', '투자유치');
      break;
    case '창업교육':
      tags.push('교육프로그램', '멘토링');
      break;
  }

  // 소스 기반 추가 태그
  if (event.source === 'devpost') {
    tags.push('해커톤' as never); // 해커톤은 AVAILABLE_TAGS에 없으므로 네트워킹으로 대체
    if (!tags.includes('네트워킹')) tags.push('네트워킹');
  }

  // 기본 대상 태그
  tags.push('청년창업');

  // 제목/설명에서 키워드 추출
  const text = `${event.title} ${event.description || ''}`.toLowerCase();

  if (text.includes('ai') || text.includes('인공지능') || text.includes('machine learning')) {
    tags.push('AI');
  }
  if (text.includes('fintech') || text.includes('핀테크') || text.includes('금융')) {
    tags.push('핀테크');
  }
  if (text.includes('health') || text.includes('헬스') || text.includes('의료')) {
    tags.push('헬스케어');
  }
  if (text.includes('global') || text.includes('글로벌') || text.includes('international')) {
    tags.push('글로벌');
  }

  // 중복 제거 및 유효 태그만 반환
  return [...new Set(tags)]
    .filter((tag) => AVAILABLE_TAGS.includes(tag as EventTag))
    .slice(0, 7);
}

/**
 * 여러 이벤트 일괄 태그 분류
 */
export async function classifyEventTagsBatch(
  events: TransformedEvent[]
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();

  for (const event of events) {
    const tags = await classifyEventTags(event);
    results.set(event.external_id, tags);
  }

  return results;
}
