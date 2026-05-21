import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { isPlatformAdmin } from '@/src/lib/auth/platform-admin'

export const runtime = 'nodejs'

/**
 * POST /api/admin/incidents — 새 인시던트 생성
 * Body: { title, severity, summary, affected_components?, status? }
 *
 * platform admin 만. status_incidents 테이블에 INSERT 후 /status 에 즉시 노출.
 * audit_logs 는 DB 트리거로 자동 기록.
 */
export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()
  if (!(await isPlatformAdmin(supabase, user))) {
    return ApiResponse.forbidden('플랫폼 관리자만 인시던트를 생성할 수 있습니다')
  }

  const body = await request.json().catch(() => ({}))
  const {
    title,
    severity,
    summary,
    affected_components,
    status = 'investigating',
  } = body as Record<string, unknown>

  if (typeof title !== 'string' || title.trim().length === 0) {
    return ApiResponse.badRequest('title 필수')
  }
  if (!['sev0', 'sev1', 'sev2', 'sev3'].includes(severity as string)) {
    return ApiResponse.badRequest('severity 는 sev0..sev3')
  }
  if (typeof summary !== 'string' || summary.trim().length === 0) {
    return ApiResponse.badRequest('summary 필수')
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('status_incidents')
    .insert({
      title: String(title).slice(0, 200),
      severity,
      summary: String(summary).slice(0, 2000),
      status,
      affected_components: Array.isArray(affected_components) ? affected_components.slice(0, 20) : [],
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return ApiResponse.internalError('인시던트 생성 실패', error.message)
  return ApiResponse.ok({ incident: data })
})

/**
 * PATCH /api/admin/incidents?id=<uuid>
 * Body: { status?, title?, summary?, root_cause?, postmortem_url?, affected_components? }
 *
 * 상태 전환·원인 분석 기입 등 업데이트. resolved 로 변경 시 resolved_at 자동 세팅.
 */
export const PATCH = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()
  if (!(await isPlatformAdmin(supabase, user))) {
    return ApiResponse.forbidden('플랫폼 관리자만 인시던트를 업데이트할 수 있습니다')
  }

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return ApiResponse.badRequest('id 쿼리 파라미터 필수')

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const update: Record<string, unknown> = {}
  if (typeof body.title === 'string') update.title = String(body.title).slice(0, 200)
  if (typeof body.summary === 'string') update.summary = String(body.summary).slice(0, 2000)
  if (typeof body.status === 'string' && ['investigating', 'identified', 'monitoring', 'resolved'].includes(body.status)) {
    update.status = body.status
    if (body.status === 'resolved') {
      update.resolved_at = new Date().toISOString()
    }
  }
  if (typeof body.root_cause === 'string') update.root_cause = String(body.root_cause).slice(0, 4000)
  if (typeof body.postmortem_url === 'string') update.postmortem_url = String(body.postmortem_url).slice(0, 500)
  if (Array.isArray(body.affected_components)) update.affected_components = body.affected_components.slice(0, 20)

  if (Object.keys(update).length === 0) {
    return ApiResponse.badRequest('업데이트할 필드 없음')
  }

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('status_incidents')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return ApiResponse.internalError('업데이트 실패', error.message)
  return ApiResponse.ok({ incident: data })
})
