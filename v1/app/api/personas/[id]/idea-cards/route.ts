import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { generateIdeas, type IdeaSource } from '@/src/lib/personas/idea-generator'
import { fetchPersonaChain } from '@/src/lib/personas/fetch'
import { resolvePersonaChain } from '@/src/lib/personas/inherit'

/**
 * GET  /api/personas/:id/idea-cards           — 카드 목록 (status별)
 * POST /api/personas/:id/idea-cards           — 카드 일괄 생성 (AI 제안)
 *   body: { source: 'self'|'internet'|'internal', count: number }
 */

export const GET = withErrorCapture(async (_request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canView } = await (admin as any).rpc('can_view_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (!canView) return ApiResponse.forbidden('권한이 없습니다')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin.from('persona_idea_cards' as never) as any)
    .select('*')
    .eq('persona_id', personaId)
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return ApiResponse.internalError('카드 조회 실패', error)
  return ApiResponse.ok({ cards: data ?? [] })
})

export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: canEdit } = await (admin as any).rpc('can_edit_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (!canEdit) return ApiResponse.forbidden('권한이 없습니다')

  const body = await request.json().catch(() => ({}))
  const source = (body.source as IdeaSource) ?? 'self'
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 15)

  if (!['self', 'internet', 'internal'].includes(source)) {
    return ApiResponse.badRequest(`유효하지 않은 source: ${source}`)
  }

  // 페르소나 + 조직명 로드
  const chain = await fetchPersonaChain(admin, personaId)
  const resolved = resolvePersonaChain(chain)

  const slotText = (key: 'identity' | 'audience' | 'content_patterns'): string => {
    const v = resolved.fields[key]?.value as { text?: string } | undefined
    return typeof v?.text === 'string' ? v.text : ''
  }
  const personaSummary = [slotText('identity'), slotText('audience'), slotText('content_patterns')]
    .filter(Boolean)
    .join('\n\n')

  const { data: personaRow } = await admin
    .from('personas')
    .select('type, owner_id, name')
    .eq('id', personaId)
    .maybeSingle<{ type: string; owner_id: string; name: string }>()

  let orgName = personaRow?.name ?? '우리 동아리'
  if (personaRow?.type === 'club') {
    const { data: club } = await admin
      .from('clubs')
      .select('name')
      .eq('id', personaRow.owner_id)
      .maybeSingle()
    orgName = club?.name ?? orgName
  }

  // 최근 덱 제목 모아 컨텍스트로
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentBundles } = await (admin.from('persona_output_bundles') as any)
    .select('event_type, event_metadata, created_at')
    .eq('persona_id', personaId)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentContext = ((recentBundles ?? []) as Array<{
    event_type: string
    event_metadata: Record<string, unknown>
  }>)
    .map((b) => {
      const title = (b.event_metadata?.title as string | undefined) ?? b.event_type
      return `- ${title}`
    })
    .join('\n')

  // internal 모드: 현재 extracted_summary 컬럼이 없어 별도 요약 파이프 미구현.
  // R4에서 persona_corpus_sources.extracted_summary 추가 시 여기서 조회해 internalDigest로 주입 예정.
  const internalDigest: string | undefined = undefined

  try {
    const ideas = await generateIdeas({
      personaSummary,
      orgName,
      source,
      count,
      recentContext,
      internalDigest,
    })

    const rows = ideas.map((i) => ({
      persona_id: personaId,
      title: i.title,
      description: i.description,
      event_type_hint: i.event_type_hint,
      source: i.source,
      status: 'pending' as const,
      created_by: user.id,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error } = await (admin.from('persona_idea_cards' as never) as any)
      .insert(rows)
      .select('*')

    if (error) return ApiResponse.internalError('카드 저장 실패', error)
    return ApiResponse.created({ cards: inserted ?? [] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return ApiResponse.internalError(`AI 생성 실패: ${msg}`)
  }
})
