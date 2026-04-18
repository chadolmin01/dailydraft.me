import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { collectCorpus } from '@/src/lib/personas/corpus'
import { extractSlotsFromCorpus } from '@/src/lib/personas/extract'
import { FIELD_CATALOG } from '@/src/lib/personas/field-catalog'
import type {
  FieldKey,
  PersonaCorpusSourceRow,
  PersonaRow,
} from '@/src/lib/personas/types'

/**
 * POST /api/personas/:id/extract
 * body: {
 *   trigger?: 'manual' | 'initial' | 'weekly',
 *   channel_ids?: string[],   // 이 호출에서만 사용할 채널 (persona_corpus_sources에 없으면 임시 소스로 처리)
 *   slots?: FieldKey[],       // 특정 슬롯만 추출. 기본: 전체 13슬롯
 * }
 *
 * 동기 실행: Gemini Flash Lite로 13슬롯 전체도 수 초 내 완료.
 * 완료 후 persona_fields upsert + persona_training_runs에 diff 기록.
 *
 * RLS: persona_fields_write_editable이 can_edit_persona()로 게이트.
 * service_role 없이 anon client만 사용 — RLS가 모든 쓰기를 검증.
 */
export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // Rate limit — Gemini Flash Lite + self-refinement 2회로 호출당 비용 큼.
  // 30req/60s (redis-rate-limiter 기본) 초과 시 429.
  const rateLimitRes = await checkAIRateLimit(user.id, getClientIp(request))
  if (rateLimitRes) return rateLimitRes

  const body = await request.json().catch(() => ({}))
  const trigger = (body.trigger ?? 'manual') as
    | 'manual'
    | 'initial'
    | 'weekly'
  const channelIds: string[] | undefined = Array.isArray(body.channel_ids)
    ? body.channel_ids.filter((x: unknown) => typeof x === 'string')
    : undefined
  const targetSlots: FieldKey[] | undefined = Array.isArray(body.slots)
    ? body.slots
    : undefined

  // 페르소나 로드 + 편집 권한 검증 (RLS가 한 번 더 막지만 조기 실패가 UX상 낫다)
  const { data: persona, error: pErr } = await (supabase as any)
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .maybeSingle()

  if (pErr) return ApiResponse.internalError('페르소나 조회 실패', pErr)
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  const { data: canEdit } = await supabase.rpc('can_edit_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (!canEdit) {
    return ApiResponse.forbidden('이 페르소나를 편집할 권한이 없습니다')
  }

  // 조직명 조회 (club 타입 기준. project/personal은 R5+)
  let orgName = persona.name
  if (persona.type === 'club') {
    const { data: club } = await supabase
      .from('clubs')
      .select('name')
      .eq('id', persona.owner_id)
      .maybeSingle()
    if (club?.name) orgName = club.name
  }

  // Corpus source 목록 — DB에 등록된 것 + 요청으로 온 channel_ids(임시)
  let sources: PersonaCorpusSourceRow[] = []
  const { data: dbSources } = await (supabase as any)
    .from('persona_corpus_sources')
    .select('*')
    .eq('persona_id', personaId)
    .eq('active', true)
  if (dbSources) sources = dbSources as PersonaCorpusSourceRow[]

  if (channelIds && channelIds.length > 0) {
    const existing = new Set(
      sources
        .filter((s) => s.source_type === 'discord_channel')
        .map((s) => s.source_ref),
    )
    for (const cid of channelIds) {
      if (existing.has(cid)) continue
      // 임시 소스 (DB에 저장 안 됨). 호출자 UI에서 "이번만" 사용할 때 쓰기 좋음.
      sources.push({
        id: `__tmp_${cid}`,
        persona_id: personaId,
        source_type: 'discord_channel',
        source_ref: cid,
        weight: 1.0,
        role_weight_rules: {},
        active: true,
        last_synced_at: null,
        created_at: new Date().toISOString(),
      })
    }
  }

  if (sources.length === 0) {
    return ApiResponse.badRequest(
      'corpus source가 없습니다. 학습할 Discord 채널을 먼저 연결하세요.',
    )
  }

  // training_runs: running 상태로 먼저 기록 (크래시 추적용)
  const runInsert = await (supabase as any)
    .from('persona_training_runs')
    .insert({
      persona_id: personaId,
      trigger,
      status: 'running',
      model_version: 'gemini-2.5-flash-lite',
    })
    .select('id')
    .single()
  const runId = runInsert.data?.id as string | undefined

  try {
    const messages = await collectCorpus(sources, {
      maxPerChannel: 300,
      topN: 200,
    })

    if (messages.length === 0) {
      await updateTrainingRun(supabase, runId, {
        status: 'failed',
        error_message: '수집된 메시지가 없습니다 (봇/너무 짧은 메시지 제외 후)',
      })
      return ApiResponse.badRequest(
        '학습할 메시지가 부족합니다. 더 활발한 채널을 선택하거나 수동 입력을 사용하세요.',
      )
    }

    const result = await extractSlotsFromCorpus(messages, {
      orgName,
      targetSlots,
    })

    // 이전 값 스냅샷 (롤백용)
    const prevKeys = result.slots.map((s) => s.field_key)
    const { data: prevFields } = await (supabase as any)
      .from('persona_fields')
      .select('field_key, value, source, confidence')
      .eq('persona_id', personaId)
      .in('field_key', prevKeys)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type PrevField = { field_key: string; value: any }
    const prevMap = new Map(
      ((prevFields ?? []) as PrevField[]).map((f) => [f.field_key as FieldKey, f]),
    )

    // upsert — 실패한 슬롯(error 있는 것)은 skip
    const diffs: Record<
      string,
      { before: unknown; after: Record<string, unknown>; confidence: number }
    > = {}

    const upserts = result.slots
      .filter((s) => !s.error && s.confidence > 0)
      .map((s) => {
        const spec = FIELD_CATALOG[s.field_key]
        const base =
          persona.type === 'club' ? spec.defaultForClub : spec.defaultForProject
        diffs[s.field_key] = {
          before: prevMap.get(s.field_key)?.value ?? null,
          after: s.value,
          confidence: s.confidence,
        }
        return {
          persona_id: personaId,
          field_key: s.field_key,
          value: s.value,
          source: 'auto' as const,
          merge_strategy: base.merge_strategy,
          locked: base.locked,
          confidence: s.confidence,
          updated_by: user.id,
        }
      })

    if (upserts.length > 0) {
      const { error: upErr } = await (supabase as any)
        .from('persona_fields')
        .upsert(upserts, { onConflict: 'persona_id,field_key' })
      if (upErr) {
        await updateTrainingRun(supabase, runId, {
          status: 'failed',
          error_message: upErr.message,
        })
        return ApiResponse.internalError('슬롯 저장에 실패했습니다', upErr)
      }
    }

    await updateTrainingRun(supabase, runId, {
      status: 'completed',
      extracted_diff: {
        slot_count: result.slots.length,
        success_count: result.success_count,
        corpus_summary: result.corpus_summary,
        diffs,
      },
    })

    return ApiResponse.ok({
      run_id: runId,
      success_count: result.success_count,
      total_count: result.total_count,
      slots: result.slots.map((s) => ({
        field_key: s.field_key,
        confidence: s.confidence,
        error: s.error ?? null,
      })),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await updateTrainingRun(supabase, runId, {
      status: 'failed',
      error_message: msg,
    })
    return ApiResponse.internalError('자동 학습 중 오류가 발생했습니다', msg)
  }
})

async function updateTrainingRun(
  supabase: Awaited<ReturnType<typeof createClient>>,
  runId: string | undefined,
  patch: Record<string, unknown>,
) {
  if (!runId) return
  await (supabase as any)
    .from('persona_training_runs')
    .update({ ...patch, completed_at: new Date().toISOString() })
    .eq('id', runId)
}
