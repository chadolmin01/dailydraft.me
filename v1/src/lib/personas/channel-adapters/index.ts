/**
 * Channel Adapter 디스패처.
 */

import type { ChannelFormat } from '@/src/lib/personas/types'
import type { AdapterInput, AdapterOutput, ChannelAdapter } from './types'
import { discordForumMarkdownAdapter } from './discord-forum-markdown'
import { instagramCaptionAdapter } from './instagram-caption'
import { linkedinPostAdapter } from './linkedin-post'
import { threadsPostAdapter } from './threads-post'
import { everytimePostAdapter } from './everytime-post'
import { emailNewsletterAdapter } from './email-newsletter'

export const ADAPTERS_BY_FORMAT: Record<ChannelFormat, ChannelAdapter> = {
  discord_forum_markdown: discordForumMarkdownAdapter,
  instagram_caption: instagramCaptionAdapter,
  linkedin_post: linkedinPostAdapter,
  threads_post: threadsPostAdapter,
  everytime_post: everytimePostAdapter,
  email_newsletter: emailNewsletterAdapter,
}

/**
 * 단일 채널 어댑터 실행.
 * 한 채널 실패해도 다른 채널은 진행할 수 있게, 에러 로깅만 하고 호출 측에서 Promise.allSettled로 처리.
 */
export async function runAdapter(
  format: ChannelFormat,
  input: AdapterInput,
): Promise<AdapterOutput> {
  const adapter = ADAPTERS_BY_FORMAT[format]
  if (!adapter) {
    throw new Error(`Unknown channel format: ${format}`)
  }
  return adapter.run(input)
}

export type { AdapterInput, AdapterOutput, ChannelAdapter } from './types'
