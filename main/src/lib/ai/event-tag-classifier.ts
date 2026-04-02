import { genAI } from './gemini-client';
import { geminiRateLimiter } from './rate-limiter';
import type { TransformedEvent } from '@/src/types/startup-events';
import { safeGenerate } from './safe-generate';
import { EventTagsSchema } from './schemas';

const AVAILABLE_TAGS = [
  // 분야
  'AI', '핀테크', '헬스케어', '에듀테크', '푸드테크', '이커머스', '게임', '콘텐츠', '하드웨어', '친환경', '바이오',
  // 단계
  '아이디어', '초기창업', '시리즈A', '시리즈B', '성장기',
  // 특성
  '딥테크', '소셜임팩트', '글로벌', '지역특화',
  // 대상
  '청년창업', '여성창업', '시니어창업', '대학생창업',
  // 지원형태
  '투자유치', '멘토링', '공간지원', '교육프로그램', '네트워킹'
];

/**
 * Classify event tags using Gemini AI
 */
export async function classifyEventTags(event: TransformedEvent): Promise<string[]> {
  if (!process.env.GOOGLE_PROJECT_ID) {
    return getFallbackTags(event);
  }

  try {
    const tags = await geminiRateLimiter.schedule(async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = buildPrompt(event);

      const { data } = await safeGenerate({
        model, prompt,
        schema: EventTagsSchema,
        extractJson: 'array',
      });

      const validTags = data
        .filter(tag => AVAILABLE_TAGS.includes(tag))
        .slice(0, 7);

      if (validTags.length < 3) {
        throw new Error(`Too few valid tags: ${validTags.length}`);
      }

      return validTags;
    });

    return tags;

  } catch {
    return getFallbackTags(event);
  }
}

/**
 * Build classification prompt
 */
function buildPrompt(event: TransformedEvent): string {
  return `당신은 창업 지원 프로그램 분류 전문가입니다. 주어진 이벤트 정보를 분석하여 관련 태그를 추출하세요.

가능한 태그 목록:
${AVAILABLE_TAGS.join(', ')}

이벤트 정보:
제목: ${event.title}
주최: ${event.organizer}
유형: ${event.event_type}
설명: ${event.description?.substring(0, 500) || '설명 없음'}

규칙:
1. 이벤트와 관련성이 높은 태그만 선택하세요
2. 3-7개의 태그를 선택하세요
3. JSON 배열 형식으로만 반환하세요 (다른 설명 없이)
4. 예시: ["AI", "딥테크", "투자유치", "청년창업"]

태그 배열:`;
}

/**
 * Fallback tags based on event type
 */
function getFallbackTags(event: TransformedEvent): string[] {
  const tags: string[] = [];

  // Add tags based on event type
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

  // Add general tags
  tags.push('청년창업');

  return tags.slice(0, 7);
}
