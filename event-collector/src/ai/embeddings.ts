/**
 * 임베딩 생성
 * backend/src/lib/ai/embeddings.ts 패턴 기반
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

// 임베딩 차원 (gemini-embedding-001 = 3072, pgvector ivfflat 제한 = 2000)
export const MAX_EMBEDDING_DIMENSIONS = 2000;

interface EmbeddingInput {
  title: string;
  organizer: string;
  event_type: string;
  description: string | null;
  interest_tags: string[];
}

/**
 * 이벤트 임베딩 생성 (캐시 지원)
 */
export async function generateEventEmbedding(
  input: EmbeddingInput
): Promise<number[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AI] GEMINI_API_KEY not set, skipping embedding');
    return null;
  }

  // 캐시 키 생성 (임베딩 텍스트 해시)
  const text = buildEmbeddingText(input);
  const hash = generateContentHash(text);
  const cacheKey = `${CACHE_KEYS.AI_EMBEDDING}${hash}`;

  // 캐시 확인
  const cachedEmbedding = await cacheGet<number[]>(cacheKey);
  if (cachedEmbedding) {
    return cachedEmbedding;
  }

  try {
    const embedding = await geminiRateLimiter.schedule(async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      // backend와 동일한 모델 사용
      const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

      const result = await model.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw new Error('No embedding values returned');
      }

      // pgvector ivfflat 인덱스 제한으로 2000차원으로 자름
      return result.embedding.values.slice(0, MAX_EMBEDDING_DIMENSIONS);
    });

    // 캐시 저장
    await cacheSet(cacheKey, embedding, CACHE_TTL.AI_EMBEDDING);

    return embedding;
  } catch (error) {
    console.warn('[AI] Embedding generation failed:', error);
    return null;
  }
}

/**
 * 임베딩용 텍스트 구성
 */
function buildEmbeddingText(input: EmbeddingInput): string {
  const parts = [
    input.title,
    `주최: ${input.organizer}`,
    `유형: ${input.event_type}`,
  ];

  if (input.description) {
    // 설명은 처음 500자만 사용
    parts.push(input.description.substring(0, 500));
  }

  if (input.interest_tags.length > 0) {
    parts.push(`태그: ${input.interest_tags.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * TransformedEvent에서 임베딩 생성
 */
export async function generateEmbeddingFromEvent(
  event: TransformedEvent,
  tags: string[]
): Promise<number[] | null> {
  return generateEventEmbedding({
    title: event.title,
    organizer: event.organizer,
    event_type: event.event_type,
    description: event.description,
    interest_tags: tags,
  });
}

/**
 * 여러 이벤트 일괄 임베딩 생성
 */
export async function generateEmbeddingsBatch(
  events: Array<{ event: TransformedEvent; tags: string[] }>
): Promise<Map<string, number[] | null>> {
  const results = new Map<string, number[] | null>();

  for (const { event, tags } of events) {
    const embedding = await generateEmbeddingFromEvent(event, tags);
    results.set(event.external_id, embedding);
  }

  return results;
}
