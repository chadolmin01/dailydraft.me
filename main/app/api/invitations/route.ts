import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { notifyProjectInvitation } from '@/src/lib/notifications/create-notification'
import { ApiResponse } from '@/src/lib/api-utils'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit/api-rate-limiter'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { rankUserMatches, type CandidateProfile } from '@/src/lib/ai/user-matcher'
import type { Profile } from '@/src/types/profile'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// 일일 초대 발송 한도 (스팸/도배 방지). 베타 단계 임시값 — UX 피드백 보고 조정.
const DAILY_INVITATION_LIMIT = 20
// 거절된 초대 재발송 쿨다운 (스토킹/괴롭힘 방지). 30일 미만 재시도는 차단.
const DECLINED_REINVITE_COOLDOWN_DAYS = 30

// POST: Create a new project invitation
export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  // Rate limit: 짧은 시간 다량 발송 차단 (분/시/일 윈도우)
  const limited = applyRateLimit(user.id, getClientIp(request))
  if (limited) return limited

  // 일일 한도 직접 체크: 같은 발신자 24h INSERT count
  // (rate-limiter는 모든 API 통합 카운트라 초대 전용 한도와 별개)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: dailyCount } = await supabase
    .from('project_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('inviter_user_id', user.id)
    .gte('created_at', since)
  if ((dailyCount ?? 0) >= DAILY_INVITATION_LIMIT) {
    return ApiResponse.rateLimited(`하루 초대 한도(${DAILY_INVITATION_LIMIT}건)를 초과했어요`)
  }

  const body = await request.json()
  const { opportunity_id, invited_user_id, role, message } = body

  if (!opportunity_id || !invited_user_id || !role) {
    return ApiResponse.badRequest('필수 항목이 누락되었습니다')
  }

  // Self-invite check
  if (invited_user_id === user.id) {
    return ApiResponse.badRequest('자기 자신을 초대할 수 없습니다')
  }

  // 차단 체크: 양방향 (내가 차단했거나 상대가 나를 차단한 경우 모두 차단).
  // 사일런트 fail 대신 명시적 에러 (스토킹 회피용 메시지는 일부러 모호하게).
  const { data: blockRow } = await supabase
    .from('user_blocks')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${invited_user_id}),and(blocker_id.eq.${invited_user_id},blocked_id.eq.${user.id})`)
    .limit(1)
    .maybeSingle()
  if (blockRow) {
    return ApiResponse.forbidden('이 사용자에게는 초대를 보낼 수 없습니다')
  }

  // Verify user is the opportunity creator
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, creator_id, title')
    .eq('id', opportunity_id)
    .single()

  if (!opportunity) {
    return ApiResponse.notFound('프로젝트를 찾을 수 없습니다')
  }

  if (opportunity.creator_id !== user.id) {
    return ApiResponse.forbidden('프로젝트 생성자만 초대할 수 있습니다')
  }

  // Duplicate check
  const { data: existing } = await supabase.from('project_invitations')
    .select('id, status, updated_at')
    .eq('opportunity_id', opportunity_id)
    .eq('invited_user_id', invited_user_id)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'pending') {
      return ApiResponse.badRequest('이미 초대를 보냈습니다')
    }
    // If previously declined, allow re-invite by updating
    if (existing.status === 'declined') {
      // 쿨다운: declined 후 30일 안에는 재초대 차단 (스팸·괴롭힘 방지)
      const lastUpdate = new Date(existing.updated_at ?? Date.now()).getTime()
      const ageDays = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24)
      if (ageDays < DECLINED_REINVITE_COOLDOWN_DAYS) {
        const remaining = Math.ceil(DECLINED_REINVITE_COOLDOWN_DAYS - ageDays)
        return ApiResponse.rateLimited(`거절된 초대는 ${remaining}일 후에 다시 보낼 수 있어요`)
      }
      const { error: updateError } = await supabase.from('project_invitations')
        .update({ status: 'pending', role, message: message || null })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Invitation update error:', updateError.message)
        return ApiResponse.internalError()
      }

      // Fetch inviter profile for notification
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single()

      await notifyProjectInvitation(
        invited_user_id,
        inviterProfile?.nickname || 'User',
        opportunity.title,
        role
      )

      return ApiResponse.ok({ success: true, id: existing.id })
    }
  }

  // Create invitation
  const { data: invitation, error: insertError } = await supabase.from('project_invitations')
    .insert({
      opportunity_id,
      inviter_user_id: user.id,
      invited_user_id,
      role,
      message: message || null,
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Invitation insert error:', insertError.message)
    return ApiResponse.internalError()
  }

  // Send notification
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('user_id', user.id)
    .single()

  await notifyProjectInvitation(
    invited_user_id,
    inviterProfile?.nickname || 'User',
    opportunity.title,
    role
  )

  return ApiResponse.ok({ success: true, id: invitation.id })
})

// GET: Fetch invitations (sent or received)
export const GET = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'received'

  // Lazy expire: cron 없이 GET 시점에 만료된 pending을 expired로 일괄 전환.
  // 양쪽 GET (sent/received) 모두 호출 시마다 실행되지만, 인덱스(idx_*_expires_at)
  // 조건부 인덱스라 비용 낮음. 누락된 invitation도 다음 GET에서 자연스럽게 정리됨.
  try {
    const adminClient = createAdminClient()
    await adminClient
      .from('project_invitations')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
  } catch (e) {
    console.warn('Lazy expire skipped:', e)
  }

  // opportunity는 PostgREST FK 관계로 join (FK: opportunity_id → opportunities.id)
  // inviter는 auth.users 참조라 PostgREST join 불가 → 별도 batch fetch
  let query = supabase
    .from('project_invitations')
    .select('*, opportunity:opportunities(id, title, type, interest_tags, needed_roles, status)')

  if (type === 'sent') {
    query = query.eq('inviter_user_id', user.id)
  } else {
    query = query.eq('invited_user_id', user.id)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    // Table might not exist yet (migration not applied)
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return ApiResponse.ok({ invitations: [] })
    }
    console.error('Invitation query error:', error.message)
    return ApiResponse.internalError()
  }

  // 상대방 프로필 batch fetch — received면 inviter, sent면 invitee
  const otherIds = Array.from(new Set(
    (data || [])
      .map((i: any) => type === 'sent' ? i.invited_user_id : i.inviter_user_id)
      .filter(Boolean)
  ))
  type ProfileMini = { user_id: string; nickname: string | null; desired_position: string | null; avatar_url: string | null }
  let profileMap: Record<string, ProfileMini> = {}
  if (otherIds.length > 0) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, nickname, desired_position, avatar_url')
      .in('user_id', otherIds)
    if (profs) {
      profileMap = Object.fromEntries(profs.map((p: any) => [p.user_id, p]))
    }
  }

  let invitations: any[] = (data || []).map((i: any) => ({
    ...i,
    inviter: profileMap[i.inviter_user_id] || null,
    invitee: profileMap[i.invited_user_id] || null,
  }))

  // 매칭 점수 부착 — received일 때 내 프로필 vs inviter 점수 계산.
  // 풀 프로필을 별도 fetch (skills/interest_tags/personality 등 필요).
  // 비용: invitations 개수만큼 candidate. 보통 < 10개라 부담 없음.
  if (type === 'received' && otherIds.length > 0) {
    const PROFILE_COLS = 'id, user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, location'
    const [{ data: myProfile }, { data: candidateProfiles }] = await Promise.all([
      supabase.from('profiles').select(PROFILE_COLS).eq('user_id', user.id).single(),
      supabase.from('profiles').select(PROFILE_COLS).in('user_id', otherIds),
    ])
    if (myProfile && candidateProfiles && candidateProfiles.length > 0) {
      try {
        const ranked = rankUserMatches(
          myProfile as unknown as Profile,
          candidateProfiles as unknown as CandidateProfile[],
        )
        const scoreMap: Record<string, { score: number; reason: string }> = Object.fromEntries(
          ranked.map(r => [r.user_id as string, { score: r.match_score, reason: r.match_reason }]),
        )
        invitations = invitations.map((i: any) => ({
          ...i,
          match: scoreMap[i.inviter_user_id] || null,
        }))
      } catch (e) {
        // 매칭 계산 실패해도 초대 응답 자체는 정상 반환 (match만 누락)
        console.warn('Match score skipped:', e)
      }
    }
  }

  return ApiResponse.ok({ invitations })
})
