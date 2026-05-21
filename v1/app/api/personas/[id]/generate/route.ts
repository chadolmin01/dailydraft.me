import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { checkAIRateLimit, getClientIp } from '@/src/lib/rate-limit/redis-rate-limiter'
import { FIELD_CATALOG } from '@/src/lib/personas/field-catalog'
import {
  generateSlotsFromAnswers,
  generateSlotsFromClubMeta,
  type GenerateAnswers,
} from '@/src/lib/personas/slot-generator'
import type {
  FieldKey,
  PersonaFieldRow,
  PersonaRow,
} from '@/src/lib/personas/types'

/**
 * POST /api/personas/:id/generate
 *
 * 스마트 자동 생성:
 *   1) 이미 수동 작성된(source='manual') 슬롯은 보호 (덮어쓰지 않음)
 *   2) identity/audience/taboos 중 수동 작성된 슬롯이 있으면 그 값을 seed로 사용
 *   3) 수동 작성 없는 seed는 클럽 메타데이터(name/description/category)로 자동 추정
 *   4) 빈(또는 자동 생성) 슬롯만 새로 채움
 *
 * body는 비어도 됨 (기본: smart). 레거시 호환 위해 manual/auto 모드는 유지.
 */
export const POST = withErrorCapture(async (request, context) => {
  const { id: personaId } = (await context.params) as { id: string }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // Rate limit — Gemini 호출 + seeds 추정까지 비용 발생
  const rateLimitRes = await checkAIRateLimit(user.id, getClientIp(request))
  if (rateLimitRes) return rateLimitRes

  const body = await request.json().catch(() => ({}))
  const mode = String(body.mode ?? 'smart') as 'smart' | 'manual' | 'auto'

  const admin = createAdminClient()

  // 권한 체크
  const { data: canEdit, error: rpcErr } = await admin.rpc('can_edit_persona', {
    p_persona_id: personaId,
    p_user_id: user.id,
  })
  if (rpcErr) return ApiResponse.internalError('권한 확인 실패', rpcErr.message)
  if (!canEdit) return ApiResponse.forbidden('이 페르소나를 편집할 권한이 없습니다')

  // 페르소나 + 조직명 + 메타 조회
  const { data: persona } = await admin
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .maybeSingle()
  if (!persona) return ApiResponse.notFound('페르소나를 찾을 수 없습니다')

  let orgName = persona.name
  let clubMeta: {
    name: string
    description?: string | null
    category?: string | null
    cohorts?: string[]
  } | null = null

  if (persona.type === 'club') {
    const { data: club } = await admin
      .from('clubs')
      .select('name, description, category')
      .eq('id', persona.owner_id)
      .maybeSingle()
    if (club) {
      orgName = club.name
      const { data: cohortRows } = await admin
        .from('club_members')
        .select('cohort')
        .eq('club_id', persona.owner_id)
        .not('cohort', 'is', null)
      const cohortSet = new Set(
        (cohortRows ?? [])
          .map((r) => r.cohort as string | null)
          .filter((c): c is string => !!c),
      )
      clubMeta = { ...club, cohorts: Array.from(cohortSet) }
    }
  }

  // 기존 슬롯 로드 (보호용 + seed 활용)
  const { data: existingFields } = await admin
    .from('persona_fields')
    .select('*')
    .eq('persona_id', personaId)
  const existing = (existingFields ?? []) as PersonaFieldRow[]
  const existingByKey = new Map<FieldKey, PersonaFieldRow>()
  for (const f of existing) existingByKey.set(f.field_key, f)

  // 수동 작성된(덮어쓰면 안 되는) 슬롯 집합
  const manualSlots = new Set<FieldKey>(
    existing.filter((f) => f.source === 'manual').map((f) => f.field_key),
  )

  // mode 분기
  let result
  let seedMeta: Record<string, unknown> = {}

  if (mode === 'auto') {
    // 레거시: 완전 자동 (클럽 메타만 사용)
    if (!clubMeta) {
      return ApiResponse.badRequest(
        '원버튼 추천은 club 타입 페르소나에만 지원됩니다',
      )
    }
    result = await generateSlotsFromClubMeta({
      name: clubMeta.name,
      description: clubMeta.description,
      category: clubMeta.category,
      cohorts: clubMeta.cohorts,
    })
    seedMeta = { mode: 'auto', club_meta_snapshot: clubMeta }
  } else if (mode === 'manual') {
    // 레거시: 3-질문 수동 입력 (body에서 받음)
    const answers: GenerateAnswers = {
      identity_seed: String(body.identity_seed ?? '').trim(),
      audience_seed: String(body.audience_seed ?? '').trim(),
      taboos_seed: String(body.taboos_seed ?? '').trim(),
    }
    if (!answers.identity_seed || !answers.audience_seed || !answers.taboos_seed) {
      return ApiResponse.badRequest('3개 질문에 모두 답변해주세요')
    }
    result = await generateSlotsFromAnswers(orgName, answers)
    seedMeta = { mode: 'manual', answers }
  } else {
    // smart: 수동 슬롯 우선 + 없으면 클럽 메타
    const identityText = extractText(existingByKey.get('identity'))
    const audienceText = extractText(existingByKey.get('audience'))
    const taboosText = extractItems(existingByKey.get('taboos'))

    const hasAnySeed = identityText || audienceText || taboosText

    if (hasAnySeed) {
      // 사용자가 한두 슬롯 작성 — 비어있는 부분은 클럽 메타로 보완한 뒤 generateSlotsFromAnswers
      const seeds: GenerateAnswers = {
        identity_seed:
          identityText ||
          fallbackFromMeta(
            '동아리 정체성',
            clubMeta,
            (m) => `${m.name}. ${m.description ?? ''} (${m.category ?? '분류 미기재'})`,
          ),
        audience_seed:
          audienceText ||
          fallbackFromMeta(
            '독자',
            clubMeta,
            (m) => `${m.category ?? '한국 대학'} 맥락의 잠재 독자층`,
          ),
        taboos_seed:
          taboosText ||
          '상투적 브랜딩 문구, 영문 대문자 라벨, 이모지 남발 등 일반 상투어',
      }
      result = await generateSlotsFromAnswers(orgName, seeds)
      seedMeta = {
        mode: 'smart',
        used_manual_seeds: {
          identity: !!identityText,
          audience: !!audienceText,
          taboos: !!taboosText,
        },
      }
    } else if (clubMeta) {
      // 수동 시드 전혀 없음 → 클럽 메타로
      result = await generateSlotsFromClubMeta({
        name: clubMeta.name,
        description: clubMeta.description,
        category: clubMeta.category,
        cohorts: clubMeta.cohorts,
      })
      seedMeta = { mode: 'smart_auto', club_meta_snapshot: clubMeta }
    } else {
      return ApiResponse.badRequest(
        '페르소나를 생성할 근거가 부족합니다 (클럽 정보도, 작성된 슬롯도 없음)',
      )
    }
  }

  if (result.success_count === 0) {
    return ApiResponse.internalError(
      'AI 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
    )
  }

  // upsert — 수동 작성 슬롯은 보호
  const upserts = result.slots
    .filter((s) => !s.error && s.confidence > 0)
    .filter((s) => !manualSlots.has(s.field_key))
    .map((s) => {
      const spec = FIELD_CATALOG[s.field_key]
      const base =
        persona.type === 'club' ? spec.defaultForClub : spec.defaultForProject
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
    const { error: upErr } = await admin
      .from('persona_fields')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(upserts as any, { onConflict: 'persona_id,field_key' })
    if (upErr) {
      console.error('[persona_generate] upsert 실패:', upErr)
      return ApiResponse.internalError(`슬롯 저장 실패: ${upErr.message}`)
    }
  }

  // training run 기록
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('persona_training_runs') as any).insert({
    persona_id: personaId,
    trigger: 'manual',
    status: 'completed',
    model_version: 'gemini-2.5-flash-lite',
    extracted_diff: {
      source: 'ai_generate',
      seed_meta: seedMeta,
      iterations_used: result.iterations_used,
      protected_manual_slots: Array.from(manualSlots),
      slot_count: upserts.length,
    },
    completed_at: new Date().toISOString(),
  })

  return ApiResponse.ok({
    mode,
    success_count: result.success_count,
    total_count: result.total_count,
    written_count: upserts.length,
    protected_count: manualSlots.size,
    slots: result.slots.map((s) => ({
      field_key: s.field_key,
      confidence: s.confidence,
      protected: manualSlots.has(s.field_key),
      error: s.error ?? null,
    })),
  })
})

// ============================================================
// Helpers
// ============================================================
function extractText(field: PersonaFieldRow | undefined): string {
  if (!field) return ''
  const v = field.value as { text?: string }
  if (typeof v.text === 'string' && v.text.trim().length >= 10) {
    return v.text.trim()
  }
  return ''
}

function extractItems(field: PersonaFieldRow | undefined): string {
  if (!field) return ''
  const v = field.value as { items?: unknown[] }
  if (!Array.isArray(v.items)) return ''
  const strs = v.items.filter((x): x is string => typeof x === 'string')
  if (strs.length === 0) return ''
  return strs.join('\n')
}

function fallbackFromMeta<T extends { name: string }>(
  _label: string,
  meta: T | null,
  fn: (m: T) => string,
): string {
  if (!meta) return ''
  return fn(meta)
}
