/**
 * GET /api/admin/audit — audit_logs 조회 (platform admin 전용).
 *
 * 필터 쿼리:
 *   action    — 정확 매칭 또는 prefix (예: 'clubs.' → 모든 clubs.* 액션)
 *   actor     — actor_user_id 정확 매칭
 *   target    — target_type 정확 매칭
 *   from      — created_at >= (ISO)
 *   to        — created_at <  (ISO)
 *   limit     — 기본 100, 최대 500
 *
 * 반환: { items, actors: Record<userId, { nickname, avatar_url }>, total }
 *   actors 는 display 용 batch lookup — N+1 방지.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

interface AuditRow {
  id: string
  actor_user_id: string | null
  action: string
  target_type: string
  target_id: string | null
  diff: unknown
  context: unknown
  created_at: string
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export const GET = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.is_admin !== true) {
    return ApiResponse.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')?.trim() || null
  const actor = searchParams.get('actor')?.trim() || null
  const target = searchParams.get('target')?.trim() || null
  const from = searchParams.get('from')?.trim() || null
  const to = searchParams.get('to')?.trim() || null
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  const service = getServiceClient()

  // audit_logs 쿼리 — generated.ts 에 아직 audit_logs 반영 안 됐을 수 있어 cast.
  let query = service
    .from('audit_logs' as never)
    .select('id, actor_user_id, action, target_type, target_id, diff, context, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (action) {
    // prefix 매칭 지원: 'clubs.' 처럼 끝에 '.' 있으면 LIKE, 아니면 exact
    if (action.endsWith('.')) {
      query = query.like('action', `${action}%`)
    } else {
      query = query.eq('action', action)
    }
  }
  if (actor) query = query.eq('actor_user_id', actor)
  if (target) query = query.eq('target_type', target)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lt('created_at', to)

  const { data, error } = await query

  if (error) return ApiResponse.internalError(error.message)

  const items = (data ?? []) as unknown as AuditRow[]

  // actor display 정보 batch lookup
  const actorIds = Array.from(
    new Set(items.map(i => i.actor_user_id).filter((v): v is string => !!v)),
  )
  const actors: Record<string, { nickname: string | null; avatar_url: string | null }> = {}
  if (actorIds.length) {
    const { data: profiles } = await service
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .in('user_id', actorIds)
    for (const p of profiles ?? []) {
      if (p.user_id) {
        actors[p.user_id] = {
          nickname: p.nickname,
          avatar_url: p.avatar_url,
        }
      }
    }
  }

  return ApiResponse.ok({
    items,
    actors,
    total: items.length,
  })
})
