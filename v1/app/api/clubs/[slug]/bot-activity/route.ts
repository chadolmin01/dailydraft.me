import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { applyRateLimit, getClientIp } from '@/src/lib/rate-limit/api-rate-limiter'

/**
 * GET /api/clubs/[slug]/bot-activity — Discord 봇 활동 데이터
 *
 * 관리자 전용: bot_interventions, team_tasks, team_decisions, team_resources 조회
 * 최근 30일 데이터만 반환 (성능)
 */
export const GET = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // Rate limit — 관리자 전용 read-only 엔드포인트 (기본 플랜 한도: 60req/min)
    const rateLimitResponse = applyRateLimit(user.id, getClientIp(request))
    if (rateLimitResponse) return rateLimitResponse

    // 클럽 조회
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 관리자 권한 확인
    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle()

    if (!membership) {
      return ApiResponse.forbidden('관리자만 봇 활동을 조회할 수 있습니다')
    }

    // 최근 30일 기준
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceISO = since.toISOString()

    // 병렬 쿼리: 통계 집계(LIMIT 없음) + 목록(LIMIT 있음)
    const [
      summaryRes,
      interventionsRes,
      tasksRes,
      decisionsRes,
      resourcesRes,
    ] = await Promise.all([
      // 통계용: user_response만 가져와서 수락률 계산 (LIMIT 없이 정확한 집계)
      supabase
        .from('bot_interventions')
        .select('user_response')
        .eq('club_id', club.id)
        .gte('created_at', sinceISO),

      // 목록용: 최근 10건만 (UI에서 10개까지만 표시)
      supabase
        .from('bot_interventions')
        .select('id, pattern_type, confidence, trigger_type, user_response, created_at, discord_channel_id')
        .eq('club_id', club.id)
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from('team_tasks')
        .select('id, assignee_name, task_description, deadline, status, created_at, completed_at')
        .eq('club_id', club.id)
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(30),

      supabase
        .from('team_decisions')
        .select('id, topic, result, decided_at')
        .eq('club_id', club.id)
        .gte('decided_at', sinceISO)
        .order('decided_at', { ascending: false })
        .limit(20),

      supabase
        .from('team_resources')
        .select('id, url, label, shared_by_name, resource_type, created_at')
        .eq('club_id', club.id)
        .gte('created_at', sinceISO)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    // 쿼리 에러 체크
    const queryError = summaryRes.error || interventionsRes.error
      || tasksRes.error || decisionsRes.error || resourcesRes.error
    if (queryError) {
      return ApiResponse.internalError('봇 활동 데이터 조회 실패', queryError.message)
    }

    const allInterventions = summaryRes.data ?? []
    const interventions = interventionsRes.data ?? []
    const tasks = tasksRes.data ?? []
    const decisions = decisionsRes.data ?? []
    const resources = resourcesRes.data ?? []

    // 정확한 통계 (LIMIT 없는 전체 데이터 기반)
    const totalInterventions = allInterventions.length
    const accepted = allInterventions.filter(i => i.user_response === 'accepted').length
    const dismissed = allInterventions.filter(i => i.user_response === 'dismissed').length
    const pendingTasks = tasks.filter(t => t.status === 'pending').length
    const completedTasks = tasks.filter(t => t.status === 'completed').length

    return ApiResponse.ok({
      summary: {
        total_interventions: totalInterventions,
        accepted,
        dismissed,
        acceptance_rate: totalInterventions > 0
          ? Math.round((accepted / totalInterventions) * 100)
          : null,
        pending_tasks: pendingTasks,
        completed_tasks: completedTasks,
        total_decisions: decisions.length,
        total_resources: resources.length,
      },
      interventions,
      tasks,
      decisions,
      resources,
    })
  }
)
