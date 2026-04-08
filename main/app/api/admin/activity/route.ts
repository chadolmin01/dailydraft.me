import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// 관리자 활동 로그 통합 API.
// 전용 activity_logs 테이블 없이 기존 테이블들을 UNION+정규화하여 타임라인 형태로 반환.
// 단점: 테이블 개수만큼 쿼리 수행 + 전체를 메모리 머지 후 slice → 대규모 데이터에서 느려짐.
// 현재 베타 규모에서는 충분. 정식 로그 테이블은 P1 이후 과제.

type ActivityItem = {
  id: string
  type: string
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  summary: string
  at: string
  meta?: Record<string, unknown>
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export const GET = withErrorCapture(async (request) => {
  const req = request as NextRequest
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.app_metadata?.is_admin !== true) {
    return ApiResponse.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 300)
  const typeFilter = searchParams.get('type') // 선택 필터: opportunity|application|coffee_chat|invitation|dm|comment|notification
  const perTable = Math.min(limit, 150)

  const admin = getServiceClient()

  // 7개 소스 병렬 fetch. 각 테이블별 필요한 컬럼만.
  const [
    { data: opps },
    { data: apps },
    { data: chats },
    { data: invs },
    { data: dms },
    { data: cmts },
    { data: notifs },
  ] = await Promise.all([
    admin.from('opportunities')
      .select('id, title, creator_id, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(perTable),
    admin.from('applications')
      .select('id, applicant_id, opportunity_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(perTable),
    admin.from('coffee_chats')
      .select('id, requester_user_id, target_user_id, owner_user_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(perTable),
    admin.from('project_invitations')
      .select('id, inviter_user_id, invited_user_id, opportunity_id, role, status, created_at')
      .order('created_at', { ascending: false })
      .limit(perTable),
    admin.from('direct_messages')
      .select('id, sender_id, receiver_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(perTable),
    admin.from('comments')
      .select('id, user_id, opportunity_id, nickname, content, created_at')
      .order('created_at', { ascending: false })
      .limit(perTable),
    admin.from('event_notifications')
      .select('id, user_id, notification_type, title, created_at')
      .order('created_at', { ascending: false })
      .limit(perTable),
  ])

  const items: ActivityItem[] = []

  for (const o of opps || []) {
    items.push({
      id: `opp:${o.id}`,
      type: 'opportunity',
      actor_id: o.creator_id,
      target_type: 'opportunity',
      target_id: o.id,
      summary: `프로젝트 생성: ${o.title}`,
      at: o.created_at || '',
      meta: { opp_type: o.type, status: o.status },
    })
  }
  for (const a of apps || []) {
    items.push({
      id: `app:${a.id}`,
      type: 'application',
      actor_id: a.applicant_id,
      target_type: 'opportunity',
      target_id: a.opportunity_id,
      summary: `프로젝트 지원 (${a.status || 'pending'})`,
      at: a.created_at || '',
    })
  }
  for (const c of chats || []) {
    items.push({
      id: `chat:${c.id}`,
      type: 'coffee_chat',
      actor_id: c.requester_user_id,
      target_type: 'user',
      target_id: c.target_user_id || c.owner_user_id,
      summary: `커피챗 요청 (${c.status})`,
      at: c.created_at || '',
    })
  }
  for (const i of invs || []) {
    items.push({
      id: `inv:${i.id}`,
      type: 'invitation',
      actor_id: i.inviter_user_id,
      target_type: 'user',
      target_id: i.invited_user_id,
      summary: `프로젝트 초대 — ${i.role} (${i.status})`,
      at: i.created_at || '',
      meta: { opportunity_id: i.opportunity_id },
    })
  }
  for (const d of dms || []) {
    items.push({
      id: `dm:${d.id}`,
      type: 'dm',
      actor_id: d.sender_id,
      target_type: 'user',
      target_id: d.receiver_id,
      summary: `쪽지: ${(d.content || '').slice(0, 60)}`,
      at: d.created_at || '',
    })
  }
  for (const c of cmts || []) {
    items.push({
      id: `cmt:${c.id}`,
      type: 'comment',
      actor_id: c.user_id,
      target_type: 'opportunity',
      target_id: c.opportunity_id,
      summary: `댓글 (${c.nickname}): ${(c.content || '').slice(0, 60)}`,
      at: c.created_at || '',
    })
  }
  for (const n of notifs || []) {
    items.push({
      id: `notif:${n.id}`,
      type: 'notification',
      actor_id: null,
      target_type: 'user',
      target_id: n.user_id,
      summary: `알림: ${n.title}`,
      at: n.created_at || '',
      meta: { notification_type: n.notification_type },
    })
  }

  // 타입 필터 적용
  const filtered = typeFilter ? items.filter(i => i.type === typeFilter) : items

  // 시간 내림차순 정렬 후 limit
  filtered.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
  const sliced = filtered.slice(0, limit)

  // 배우/타겟 프로필 batch fetch (닉네임 해상도)
  const userIds = Array.from(new Set(
    sliced.flatMap(i => [i.actor_id, i.target_type === 'user' ? i.target_id : null]).filter(Boolean) as string[]
  ))
  let profiles: Record<string, { nickname: string | null; avatar_url: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profs } = await admin
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .in('user_id', userIds)
    if (profs) {
      profiles = Object.fromEntries(profs.map(p => [p.user_id, { nickname: p.nickname, avatar_url: p.avatar_url }]))
    }
  }

  return ApiResponse.ok({
    items: sliced,
    profiles,
    total: sliced.length,
  })
})
