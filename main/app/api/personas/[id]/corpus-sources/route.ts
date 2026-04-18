import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { fetchGuildChannels } from '@/src/lib/discord/client'
import type {
  PersonaCorpusSourceRow,
  PersonaRow,
} from '@/src/lib/personas/types'

/**
 * GET /api/personas/:id/corpus-sources
 *
 * 현재 등록된 corpus source 목록 + 사용 가능한 Discord 채널 목록을 동시 반환.
 * UI 한 번의 요청으로 "선택 가능 채널" 체크박스 뷰를 구성할 수 있게 함.
 *
 * club 타입 페르소나만 Discord 채널 fetch. project/personal은 R5에서 별도 경로.
 */
export const GET = withErrorCapture(async (_request, context) => {
  const { id: personaId } = (await context.params) as { id: string }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: persona, error: pErr } = await supabase
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .maybeSingle<PersonaRow>()
  if (pErr) return ApiResponse.internalError('페르소나 조회 실패', pErr)
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  // RLS(persona_corpus_sources_select)가 편집자만 조회 허용하므로 추가 체크 불요
  const { data: sources } = await supabase
    .from('persona_corpus_sources')
    .select('*')
    .eq('persona_id', personaId)
    .order('created_at', { ascending: true })

  // 사용 가능한 Discord 채널 조회 (club 페르소나만)
  let availableChannels: Array<{
    id: string
    name: string
    type: number
    parent_id: string | null
  }> = []

  if (persona.type === 'club') {
    const { data: installation } = await supabase
      .from('discord_bot_installations')
      .select('discord_guild_id')
      .eq('club_id', persona.owner_id)
      .maybeSingle<{ discord_guild_id: string }>()

    if (installation?.discord_guild_id) {
      try {
        const channels = await fetchGuildChannels(installation.discord_guild_id)
        // type 0=텍스트, 5=공지, 15=포럼만 남김. 음성/카테고리 제외.
        availableChannels = channels
          .filter((c) => c.type === 0 || c.type === 5 || c.type === 15)
          .map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            parent_id: c.parent_id ?? null,
          }))
      } catch (err) {
        console.warn(
          '[corpus-sources] Discord 채널 조회 실패:',
          (err as Error).message,
        )
      }
    }
  }

  return ApiResponse.ok({
    sources: (sources ?? []) as PersonaCorpusSourceRow[],
    available_channels: availableChannels,
    has_discord: availableChannels.length > 0,
  })
})

/**
 * PUT /api/personas/:id/corpus-sources
 * body: { discord_channel_ids: string[], role_weight_rules?: Record<string, unknown> }
 *
 * 기존 discord_channel 소스를 전부 삭제하고 새로 upsert (replace 시맨틱).
 * 다른 source_type(github_repo 등)은 건드리지 않음.
 *
 * RLS(persona_corpus_sources_write)가 can_edit_persona로 게이트.
 */
export const PUT = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const channelIds: string[] = Array.isArray(body.discord_channel_ids)
    ? body.discord_channel_ids.filter((x: unknown) => typeof x === 'string')
    : []
  const roleRules = (body.role_weight_rules ?? {}) as Record<string, unknown>

  // 기존 discord_channel 소스 전체 삭제 (replace 시맨틱)
  const { error: delErr } = await supabase
    .from('persona_corpus_sources')
    .delete()
    .eq('persona_id', personaId)
    .eq('source_type', 'discord_channel')
  if (delErr) {
    return ApiResponse.internalError('기존 소스 삭제 실패', delErr)
  }

  if (channelIds.length === 0) {
    return ApiResponse.ok({ sources: [] })
  }

  const inserts = channelIds.map((channelId) => ({
    persona_id: personaId,
    source_type: 'discord_channel' as const,
    source_ref: channelId,
    weight: 1.0,
    role_weight_rules: roleRules,
    active: true,
  }))

  const { data, error } = await supabase
    .from('persona_corpus_sources')
    .insert(inserts)
    .select('*')

  if (error) {
    return ApiResponse.internalError('corpus 소스 저장 실패', error)
  }

  return ApiResponse.ok({ sources: data ?? [] })
})
