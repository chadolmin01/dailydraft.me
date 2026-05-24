/**
 * Chunk 생성 + Google embedding.
 *
 * 의도: parsed_text 를 LLM context 친화적 chunk 로 쪼개고, 각 chunk 의 의미를
 *       embedding 으로 변환 → file_chunks 테이블에 저장.
 *       Chat 의 search_file_contents tool 이 이걸 query embedding 과 cosine
 *       similarity 비교해서 본문 retrieval.
 *
 * SDK: @google/genai v1.49 (이미 설치, Gemini fallback 과 공유).
 * Model: text-embedding-004 (768 dim native, $0.006/M tokens 가장 저렴).
 *
 * 비용: parsed_text 50KB ≈ 12K tokens = $0.000072 (약 0.1원/파일).
 */

import { GoogleGenAI } from '@google/genai'

// 한국어 ~150 tokens (≈ 600 chars). 너무 작으면 의미 단절, 너무 크면 retrieval 정확도 ↓.
export const CHUNK_SIZE_CHARS = 600
// 100자 overlap = 인접 chunk 간 의미 끊김 완화.
export const CHUNK_OVERLAP_CHARS = 100
// Google API batch limit 보수적 = 100 per call.
const BATCH_SIZE = 100
// text-embedding-004 는 native 768 dim. 마이그레이션의 vector(768) 와 정확히 일치.
const EMBEDDING_MODEL = 'text-embedding-004'

/**
 * Sliding window chunking — 단순 char 기반 (한국어 split 도 OK).
 * 의도: 의미 단위 (문단/문장) split 보다 단순함 우선. 정확도 부족 시 후속 개선.
 */
export function splitIntoChunks(text: string): string[] {
  const out: string[] = []
  if (text.length === 0) return out
  const stride = CHUNK_SIZE_CHARS - CHUNK_OVERLAP_CHARS
  for (let i = 0; i < text.length; i += stride) {
    const piece = text.slice(i, i + CHUNK_SIZE_CHARS)
    // 빈 chunk (전부 공백) 는 skip — embedding 비용 낭비.
    if (piece.trim().length > 0) out.push(piece)
    // 마지막 chunk 가 짧고 이미 끝에 닿았으면 종료.
    if (i + CHUNK_SIZE_CHARS >= text.length) break
  }
  return out
}

/**
 * 여러 chunk 를 batch 로 embedding.
 * - chunks.length 가 0 이면 빈 배열 반환.
 * - GEMINI_API_KEY 없으면 throw (호출자가 catch 해서 silent fail 처리).
 * - 부분 실패 시 throw (전체 또는 0 — partial 안 됨, 호출자가 재시도/skip 결정).
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  if (chunks.length === 0) return []
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY 없음 — embedding 생성 불가')
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const out: number[][] = []
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const slice = chunks.slice(i, i + BATCH_SIZE)
    const resp = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: slice,
    })
    const embeddings = resp.embeddings ?? []
    if (embeddings.length !== slice.length) {
      throw new Error(
        `embedContent 응답 부정합: 입력 ${slice.length} 개, 응답 ${embeddings.length} 개`,
      )
    }
    for (const emb of embeddings) {
      if (!emb.values || emb.values.length === 0) {
        throw new Error('embedContent 응답에 values 없음')
      }
      out.push(emb.values)
    }
  }
  return out
}

/**
 * 단일 query → 1개 embedding. Chat tool 에서 사용.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const [vec] = await embedChunks([query])
  if (!vec) throw new Error('embedQuery: 응답 없음')
  return vec
}
