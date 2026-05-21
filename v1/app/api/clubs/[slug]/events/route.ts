/**
 * GET /api/clubs/[slug]/events — 클럽 일정 목록
 *   query: from (ISO), to (ISO), cohort
 * POST /api/clubs/[slug]/events — 일정 등록 (admin/owner)
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

const EVENT_TYPES = ['meeting', 'presentation', 'recruit', 'workshop', 'social', 'deadline', 'other']

export const GET = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  const { searchParams } = new URL(request.url)
  const fromRaw = searchParams.get('from')
  const toRaw = searchParams.get('to')
  const cohort = searchParams.get('cohort')

  const admin = createAdminClient()
  // 멤버십 확인 — RLS 대체
  const { data: membership } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!membership) return ApiResponse.forbidden('클럽 멤버만 조회 가능')

  // club_events 테이블은 20260419150000 마이그레이션으로 추가됨 — database.ts 재생성 전까지 any 캐스트
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (admin as any)
    .from('club_events')
    .select('id, title, description, event_type, location, start_at, end_at, all_day, cohort, created_by, created_at')
    .eq('club_id', club.id)
    .order('start_at', { ascending: true })

  if (fromRaw) q = q.gte('start_at', fromRaw)
  if (toRaw) q = q.lte('start_at', toRaw)
  if (cohort) q = q.eq('cohort', cohort)

  const { data: events, error } = await q
  if (error) return ApiResponse.internalError(error.message)

  return ApiResponse.ok({ events: events ?? [] })
})

export const POST = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (!membership) return ApiResponse.forbidden('운영진만 일정을 등록할 수 있습니다')

  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const startAt = typeof body.start_at === 'string' ? body.start_at : null
  const eventType = typeof body.event_type === 'string' && EVENT_TYPES.includes(body.event_type)
    ? body.event_type
    : 'meeting'

  if (!title) return ApiResponse.badRequest('제목은 필수입니다')
  if (!startAt) return ApiResponse.badRequest('시작 시간은 필수입니다')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created, error } = await (admin as any)
    .from('club_events')
    .insert({
      club_id: club.id,
      title,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : null,
      event_type: eventType,
      location: typeof body.location === 'string' ? body.location.trim().slice(0, 300) : null,
      start_at: startAt,
      end_at: typeof body.end_at === 'string' ? body.end_at : null,
      all_day: body.all_day === true,
      cohort: typeof body.cohort === 'string' && body.cohort.length > 0 ? body.cohort : null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return ApiResponse.internalError(error.message)
  return ApiResponse.created(created)
})
