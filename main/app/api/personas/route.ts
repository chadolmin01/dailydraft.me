import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type {
  PersonaFieldRow,
  PersonaRow,
  PersonaType,
} from '@/src/lib/personas/types'

/**
 * GET /api/personas?type=club&owner_id=<uuid>
 *
 * 단일 owner의 활성 페르소나 + 필드 조회.
 * active 우선, 없으면 draft 최신. 둘 다 없으면 persona=null.
 *
 * RLS가 조회 권한(can_view_persona)을 강제하므로 API 레벨에서 추가 검증 불요.
 */
export const GET = withErrorCapture(async (request) => {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as PersonaType | null
  const ownerId = searchParams.get('owner_id')

  if (!type || !ownerId) {
    return ApiResponse.badRequest('type과 owner_id는 필수입니다')
  }
  if (type !== 'club' && type !== 'project' && type !== 'personal') {
    return ApiResponse.badRequest('유효하지 않은 type입니다')
  }

  const supabase = await createClient()

  const { data: personas, error: pErr } = await supabase
    .from('personas')
    .select('*')
    .eq('type', type)
    .eq('owner_id', ownerId)
    .in('status', ['active', 'draft'])
    .order('status', { ascending: true }) // 'active' < 'draft' 문자열 정렬: active 먼저
    .order('version', { ascending: false })
    .limit(1)

  if (pErr) {
    return ApiResponse.internalError('페르소나 조회에 실패했습니다', pErr)
  }

  const persona = (personas?.[0] ?? null) as PersonaRow | null

  if (!persona) {
    return ApiResponse.ok({ persona: null, fields: [], resolvedFields: null })
  }

  const { data: fields, error: fErr } = await supabase
    .from('persona_fields')
    .select('*')
    .eq('persona_id', persona.id)

  if (fErr) {
    return ApiResponse.internalError('페르소나 필드 조회에 실패했습니다', fErr)
  }

  return ApiResponse.ok({
    persona,
    fields: (fields ?? []) as PersonaFieldRow[],
    resolvedFields: null, // R2: 상속 체인 resolve 시 채움
  })
})

/**
 * POST /api/personas
 * body: { type, owner_id, name, parent_persona_id? }
 *
 * 새 페르소나 생성. status='draft'로 시작. RLS의 personas_insert_authenticated가
 * created_by = auth.uid()를 강제.
 */
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({}))
  const { type, owner_id, name, parent_persona_id } = body as {
    type?: PersonaType
    owner_id?: string
    name?: string
    parent_persona_id?: string | null
  }

  if (!type || !owner_id || !name) {
    return ApiResponse.badRequest('type, owner_id, name은 필수입니다')
  }

  // 권한 선검증: club 타입이면 해당 클럽 admin이어야 함.
  // project/personal은 여기선 스킵 (type 자체가 현재 club만 지원).
  //
  // 권한 체크는 rpc(admin client)로 수행. INSERT는 admin client로 수행하되
  // created_by를 명시적으로 user.id로 세팅하여 감사 추적 보존.
  // 이유 주석: Next.js 15 App Router + Supabase SSR 조합에서 cookie 기반 세션이
  // INSERT 시점 auth.uid()로 전파되지 않는 RLS 42501 이슈 회피. RLS는 여전히 다른
  // client(프론트/anon)에는 동작.
  const admin = createAdminClient()

  if (type === 'club') {
    const { data: adminCheck, error: rpcErr } = await admin.rpc('is_club_admin', {
      p_club_id: owner_id,
      p_user_id: user.id,
    })
    if (rpcErr) {
      console.error('[personas] is_club_admin rpc 실패:', rpcErr)
      return ApiResponse.internalError('권한 확인 실패', rpcErr.message)
    }
    if (!adminCheck) {
      return ApiResponse.forbidden('동아리 대표 또는 운영진만 페르소나를 만들 수 있습니다')
    }
  } else if (type === 'project') {
    // 프로젝트 리드(opportunity creator) 또는 소속 클럽 admin 만 생성 가능
    const { data: opp, error: oppErr } = await admin
      .from('opportunities')
      .select('creator_id, club_id')
      .eq('id', owner_id)
      .maybeSingle()

    if (oppErr || !opp) {
      return ApiResponse.badRequest('프로젝트를 찾을 수 없습니다')
    }

    let canCreate = opp.creator_id === user.id
    if (!canCreate && opp.club_id) {
      const { data: clubAdminCheck } = await admin.rpc('is_club_admin', {
        p_club_id: opp.club_id,
        p_user_id: user.id,
      })
      canCreate = !!clubAdminCheck
    }
    if (!canCreate) {
      return ApiResponse.forbidden('프로젝트 리드만 페르소나를 만들 수 있습니다')
    }
  } else if (type === 'personal') {
    // 개인 페르소나는 2026 여름 출시 예정 — 현재 생성 차단
    return ApiResponse.forbidden('개인 페르소나는 2026 여름 출시 예정입니다')
  }

  const { data, error } = await admin
    .from('personas')
    .insert({
      type,
      owner_id,
      name,
      parent_persona_id: parent_persona_id ?? null,
      status: 'draft',
      created_by: user.id,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[personas] insert 실패:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })
    return ApiResponse.internalError(`페르소나 생성 실패: ${error.message}`, error)
  }

  return ApiResponse.created(data)
})
