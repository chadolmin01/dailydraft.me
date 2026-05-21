/**
 * Threads 포스트 어댑터 (단일 또는 체인).
 *
 * 규칙:
 *   - 포스트 1개당 500자 하드 리밋 (Meta 공식)
 *   - 내용이 많으면 LLM이 여러 post로 분할한 `posts: string[]` 반환
 *   - 각 포스트 끝에 "1/N" 번호 자동 부착 (체인일 때만)
 *   - 마지막 포스트에만 해시태그 집중 (3~5개)
 *   - 이모지 OK (트위터 문화 닮음 — 가볍고 짧게)
 *   - 마크다운 금지 (Threads 마크다운 안 렌더)
 *
 * R3.1: is_copy_only=true — 사용자가 각 포스트 수동 복사. R3.4에서 Graph API 체인 자동 발행.
 */

import { z } from 'zod'
import { chatModel } from '@/src/lib/ai/gemini-client'
import { safeGenerate } from '@/src/lib/ai/safe-generate'
import type { ChannelAdapter } from './types'
import { buildPersonaPrompt } from './persona-prompt'

const MAX_POST_CHARS = 500
const NUMBER_RESERVE = 8 // "1/10 " 같은 번호 접두사용 여유 공간

const OUTPUT = z.object({
  // 각 포스트는 번호 붙이기 전 450자 이하. 번호(5~8자) 추가 후 500자 이하 보장.
  posts: z.array(z.string().min(10).max(MAX_POST_CHARS - NUMBER_RESERVE)).min(1).max(10),
  hashtags: z.array(z.string().regex(/^#/)).min(0).max(5),
})

/**
 * 체인일 때 각 포스트에 "1/N" 번호 부착.
 * 단일이면 번호 생략 (깔끔함).
 */
function addChainNumbers(posts: string[]): string[] {
  if (posts.length === 1) return posts
  return posts.map((p, i) => `${p}\n\n${i + 1}/${posts.length}`)
}

/**
 * 해시태그는 마지막 포스트 끝에 붙임.
 * 마지막 포스트 + 해시태그 합계가 500자 초과하면 해시태그만 단독 포스트로 분리.
 */
function appendHashtagsToChain(posts: string[], hashtags: string[]): string[] {
  if (hashtags.length === 0) return posts
  const tagLine = hashtags.join(' ')
  const last = posts[posts.length - 1]
  const merged = `${last}\n\n${tagLine}`
  if (merged.length <= MAX_POST_CHARS) {
    return [...posts.slice(0, -1), merged]
  }
  // 마지막 포스트가 꽉 차 해시태그 단독 포스트로
  return [...posts, tagLine]
}

export const threadsPostAdapter: ChannelAdapter = {
  channelFormat: 'threads_post',

  async run(input) {
    const { prompt: personaPrompt, usedSlots } = buildPersonaPrompt(input.persona, [
      'identity',
      'audience',
      'hooking_style',
      'ending_signature',
      'vocabulary',
      'taboos',
    ])

    const meta = JSON.stringify(input.eventMetadata, null, 2)
    const corpus = input.corpusHint ? `\n\n[참고 원본]\n${input.corpusHint}` : ''

    const prompt = `${personaPrompt}

# 과제
당신은 "${input.orgName}"의 공식 Threads 운영자입니다.
아래 이벤트를 Threads 포스트로 작성하세요.

이벤트 타입: ${input.eventType}
이벤트 메타:
${meta}${corpus}

# Threads 플랫폼 특성
- 한 포스트 500자 하드 리밋 (Meta 공식)
- 트위터/X와 문화 유사: 짧고 가볍고 호흡 빠름
- 내용이 많으면 **체인(여러 포스트 연결)** 으로 나눠서 씀
- 이모지 사용 자연스러움
- 해시태그는 과하지 않게 (3~5개)

# 작성 규칙 (중요)
- **500자 이하로 끝날 수 있으면 posts 배열에 단 1개**만 반환. 억지로 쪼개지 말 것.
- 500자 초과 필요 시에만 체인으로 분할. 각 포스트는 450자 이하 (번호 공간 확보).
- 체인 작성 시:
  - 첫 포스트: 강력한 훅 (읽는 이가 "다음 포스트 봐야지" 생각하게)
  - 중간 포스트: 한 포스트 = 한 아이디어 (잘라 읽어도 이해되게)
  - 마지막 포스트: 핵심 결론 + CTA (다음 행동 유도)
- 어미는 페르소나 sentence_style 따름 (LinkedIn과 달리 격식 강제 X — Threads는 캐주얼)
- **마크다운 문법 사용 절대 금지**: \`**굵게**\`, \`*기울임*\`, \`# 제목\`, \`- 리스트\` 등 전부 금지. Threads는 마크다운 렌더링 안 해서 그대로 리터럴 표시됨. 강조는 줄바꿈·이모지·대문자로만.
- 해시태그는 본문에 섞지 말고 배열로 별도 반환. 시스템이 마지막 포스트에 자동 부착.

반드시 JSON으로만 응답:
{
  "posts": ["...", "..."],
  "hashtags": ["#TagOne", "#TagTwo"]
}`

    const { data } = await safeGenerate({
      model: chatModel,
      prompt,
      schema: OUTPUT,
      extractJson: 'object',
      maxRetries: 1,
    })

    // 번호 부착 후 해시태그 붙이기
    const numbered = addChainNumbers(data.posts)
    const final = appendHashtagsToChain(numbered, data.hashtags)

    // UI 표시용: 포스트 사이를 구분선으로 합친 단일 문자열
    const joined = final.join('\n\n──────\n\n')
    const totalChars = final.reduce((sum, p) => sum + p.length, 0)

    return {
      channel_format: 'threads_post',
      generated_content: joined,
      title: null,
      format_constraints: {
        char_limit: MAX_POST_CHARS,
        char_used: totalChars,
        hashtag_min: 0,
        hashtag_max: 5,
        hashtag_count: data.hashtags.length,
        // Threads 전용 메타 — UI가 체인이면 각 포스트를 개별 카드로 보여주도록
        post_count: final.length,
        is_chain: final.length > 1,
        posts: final,
        is_copy_only: true, // R3.1. R3.4에서 Graph API 체인 자동 발행
      },
      is_copy_only: true,
      used_slots: usedSlots,
    }
  },
}
