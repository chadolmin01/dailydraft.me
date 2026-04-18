/**
 * Persona Corpus 수집 + 정제 + 가중치.
 *
 * 입력: persona_corpus_sources 행들 (discord_channel 타입)
 * 출력: 가중치가 적용된 메시지 샘플 배열 — LLM 추출 입력으로 사용
 *
 * 설계 결정:
 *   - Discord API는 서버 사이드 (Bot 토큰)에서만 호출. 여기서는 메시지 수집·정제·가중치만.
 *   - 가중치는 "동일 메시지를 여러 번 샘플에 넣는 방식" (repeat)이 아니라
 *     메시지마다 weight 숫자를 붙여 LLM 프롬프트에 명시적으로 전달 → 모델이 우선순위 이해.
 *   - 메시지 총량이 많을 때는 weight 기준으로 top N만 사용 (context window 절약).
 */

import { fetchChannelMessages, type DiscordMessage } from '@/src/lib/discord/client'
import type { PersonaCorpusSourceRow } from './types'

/** 한 메시지의 정제·가중치 부여 결과. LLM 입력용. */
export interface WeightedMessage {
  source_ref: string          // 채널 ID
  message_id: string
  author_id: string
  author_name: string
  timestamp: string
  content: string
  weight: number              // 최종 가중치 (소스 weight × 역할·반응 규칙 적용 후)
  reactions_count: number
  is_announcement: boolean    // 공지 채널 여부 (role_weight_rules.channel_type='announcement' 등)
}

interface CollectOptions {
  /** 채널당 최대 메시지 수. 기본 500. */
  maxPerChannel?: number
  /** 최종 반환할 top N 메시지 (weight 내림차순). 기본 300. */
  topN?: number
  /** 특정 role(author user_id)별 가중 배수 계산 함수. 없으면 role_weight_rules만 사용. */
  getRoleForAuthor?: (authorDiscordId: string) => Promise<string | null>
}

/**
 * 여러 corpus source를 병렬로 수집, 정제, 가중치 부여, 상위 N개 반환.
 * 정제 규칙:
 *   - bot=true 메시지 제외
 *   - 빈 content 제외
 *   - content 길이 10자 미만 제외 (이모지/짧은 반응만 있는 것)
 *   - URL 또는 멘션만 있는 메시지 제외
 */
export async function collectCorpus(
  sources: PersonaCorpusSourceRow[],
  options: CollectOptions = {},
): Promise<WeightedMessage[]> {
  const maxPerChannel = options.maxPerChannel ?? 500
  const topN = options.topN ?? 300

  const discordSources = sources.filter(
    (s) => s.active && s.source_type === 'discord_channel',
  )
  if (discordSources.length === 0) return []

  // 채널별 메시지 병렬 fetch (각 채널 독립)
  const perChannel = await Promise.all(
    discordSources.map(async (source) => {
      try {
        const messages = await fetchChannelMessages(source.source_ref, {
          maxMessages: maxPerChannel,
        })
        return { source, messages }
      } catch (err) {
        // 한 채널 실패해도 나머지 진행 — 로그만.
        console.warn(
          `[corpus] discord channel ${source.source_ref} fetch 실패:`,
          (err as Error).message,
        )
        return { source, messages: [] as DiscordMessage[] }
      }
    }),
  )

  const weighted: WeightedMessage[] = []

  for (const { source, messages } of perChannel) {
    const rules = (source.role_weight_rules ?? {}) as {
      president?: number
      officer?: number
      member?: number
      reaction_threshold?: number
      reaction_multiplier?: number
      channel_type_weights?: Record<string, number>
    }

    const channelTypeMultiplier =
      rules.channel_type_weights?.['announcement'] ??
      (source.role_weight_rules as Record<string, unknown>)['announcement_multiplier'] ??
      1

    for (const msg of messages) {
      if (!isQualityMessage(msg)) continue

      // 역할 기반 가중치
      let roleMultiplier = 1
      if (options.getRoleForAuthor) {
        const role = await options.getRoleForAuthor(msg.author.id)
        if (role === 'owner' || role === 'president') {
          roleMultiplier = rules.president ?? 5
        } else if (role === 'admin' || role === 'officer') {
          roleMultiplier = rules.officer ?? 3
        } else {
          roleMultiplier = rules.member ?? 1
        }
      }

      // 반응 기반 가중치 (Discord 메시지에 reactions 필드가 있을 때만)
      const reactionsCount = countReactions(msg)
      const threshold = rules.reaction_threshold ?? 5
      const reactionMultiplier =
        reactionsCount >= threshold ? rules.reaction_multiplier ?? 2 : 1

      const finalWeight =
        (source.weight ?? 1) *
        Number(channelTypeMultiplier) *
        roleMultiplier *
        reactionMultiplier

      weighted.push({
        source_ref: source.source_ref,
        message_id: msg.id,
        author_id: msg.author.id,
        author_name: msg.author.global_name || msg.author.username,
        timestamp: msg.timestamp,
        content: msg.content,
        weight: finalWeight,
        reactions_count: reactionsCount,
        is_announcement: Number(channelTypeMultiplier) > 1,
      })
    }
  }

  // weight 내림차순 정렬 후 topN
  weighted.sort((a, b) => b.weight - a.weight)
  return weighted.slice(0, topN)
}

/**
 * 메시지 품질 필터.
 * 페르소나 학습에 도움 안 되는 메시지(봇, 너무 짧은 것, URL만 있는 것 등) 제거.
 */
function isQualityMessage(msg: DiscordMessage): boolean {
  if (msg.author.bot) return false
  const content = msg.content?.trim() ?? ''
  if (content.length < 10) return false

  // URL만 있는 메시지 제외
  const withoutUrls = content.replace(/https?:\/\/\S+/g, '').trim()
  if (withoutUrls.length < 5) return false

  // 멘션만 있는 메시지 제외
  const withoutMentions = content.replace(/<@[!&]?\d+>/g, '').trim()
  if (withoutMentions.length < 5) return false

  return true
}

/**
 * Discord 메시지의 총 반응 개수.
 * DiscordMessage 타입에 reactions 필드가 정의되지 않아 any 우회.
 */
function countReactions(msg: DiscordMessage): number {
  const reactions = (msg as unknown as { reactions?: { count: number }[] }).reactions
  if (!Array.isArray(reactions)) return 0
  return reactions.reduce((sum, r) => sum + (r.count ?? 0), 0)
}

/**
 * LLM 프롬프트용 corpus 요약 텍스트.
 * 각 메시지를 "[weight=N, reactions=M, 작성자] 본문" 형태로 포맷팅.
 * 모델이 weight가 높은 메시지가 "동아리다운" 것임을 이해하도록 명시.
 */
export function formatCorpusForPrompt(messages: WeightedMessage[]): string {
  if (messages.length === 0) return '(corpus 없음)'
  return messages
    .map((m) => {
      const tag = m.is_announcement ? '📢공지' : '일반'
      return `[${tag} weight=${m.weight.toFixed(1)} reactions=${m.reactions_count} by ${m.author_name}]
${m.content}`
    })
    .join('\n---\n')
}
