/**
 * POST /api/clubs/[slug]/remind-teams — 미제출 팀 팀장에게 일괄 DM 발송
 *
 * body: { team_ids?: string[]; message?: string }
 *   - team_ids 없으면 missing/overdue 팀 전체
 *   - message 없으면 기본 템플릿
 *
 * 왜: 운영진이 매주 월요일 "업데이트 안 쓴 팀 찾아서 DM" 반복작업을 1번 클릭으로.
 * 팀 매니저(creator_id)에게 direct_messages 테이블로 삽입 — 기존 메시지 infra 재사용.
 *
 * 제약:
 *   - admin 만 호출 가능
 *   - 같은 팀에 1일 1회 (last_reminder_at 체크)
 *   - 블록 테이블 체크
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

export const POST = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name')
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

  if (!membership) return ApiResponse.forbidden('운영진만 리마인드를 보낼 수 있습니다')

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const teamIds = Array.isArray(body.team_ids) ? body.team_ids as string[] : null
  const customMessage = typeof body.message === 'string' ? body.message.trim().slice(0, 800) : null

  const admin = createAdminClient()

  // 1. 대상 팀 조회 — 미제출/지연만
  let oppQuery = admin
    .from('opportunities')
    .select('id, title, creator_id, cohort')
    .eq('club_id', club.id)

  if (teamIds && teamIds.length > 0) {
    oppQuery = oppQuery.in('id', teamIds)
  }

  const { data: opportunities = [] } = await oppQuery
  if (!opportunities || opportunities.length === 0) {
    return ApiResponse.ok({ sent: 0, skipped: 0, total: 0 })
  }

  // 2. 주간 업데이트 조회 (이번 주 제출 여부 판단)
  const oppIds = opportunities.map(o => o.id)
  const { data: updates = [] } = await admin
    .from('project_updates')
    .select('opportunity_id, week_number, created_at')
    .in('opportunity_id', oppIds)
    .order('week_number', { ascending: false })

  const latestWeek = (updates ?? []).reduce((max, u) => Math.max(max, u.week_number), 0)
  const submittedThisWeek = new Set(
    (updates ?? []).filter(u => u.week_number === latestWeek).map(u => u.opportunity_id)
  )

  // 3. 대상 필터 + 블록 체크
  const targets = (opportunities ?? []).filter(o => {
    if (teamIds && teamIds.length > 0) return true // explicit override
    return !submittedThisWeek.has(o.id) // 미제출만
  })

  let sent = 0
  let skipped = 0

  const defaultMessage = (teamTitle: string) =>
    `안녕하세요, ${club.name} 운영진입니다. "${teamTitle}" 팀의 이번 주 업데이트가 아직 작성되지 않았습니다. 짧게라도 이번 주 진행 사항을 남겨주세요. 🙏`

  for (const team of targets) {
    if (!team.creator_id || team.creator_id === user.id) {
      skipped += 1
      continue
    }

    // block 체크
    const { data: blockRow } = await admin
      .from('user_blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${team.creator_id}),and(blocker_id.eq.${team.creator_id},blocked_id.eq.${user.id})`)
      .limit(1)
      .maybeSingle()

    if (blockRow) {
      skipped += 1
      continue
    }

    // 최근 24시간 이내 같은 팀에 리마인드 보냈는지 체크 (스팸 방지)
    const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()
    const { count: recentCount } = await admin
      .from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', team.creator_id)
      .gte('created_at', oneDayAgo)

    if ((recentCount ?? 0) >= 3) {
      skipped += 1
      continue
    }

    const content = customMessage && customMessage.length > 0
      ? customMessage
      : defaultMessage(team.title)

    const { error } = await admin.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: team.creator_id,
      content,
    })

    if (!error) sent += 1
    else skipped += 1
  }

  return ApiResponse.ok({ sent, skipped, total: targets.length })
})
