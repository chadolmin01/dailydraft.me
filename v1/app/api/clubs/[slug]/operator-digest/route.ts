/**
 * POST /api/clubs/[slug]/operator-digest — 클럽 운영자 주간 다이제스트 이메일 발송
 *
 * body: { test_only?: boolean }
 *   - test_only: 호출자 본인에게만 미리보기 발송 (기본: false 이면 모든 admin/owner)
 *
 * 왜 POST: 이메일 발송은 side-effect. idempotent 하지 않음 (매번 발송).
 * Cron 에서도 이 엔드포인트 호출 가능.
 *
 * 데이터:
 *   - 최근 7일 주간 업데이트 제출률
 *   - 미제출/지연 팀 목록
 *   - 최근 의사결정
 *   - MVP (가장 많은 업데이트 작성자)
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { renderOperatorDigestEmail } from '@/src/lib/email/templates/operator-digest'
import { resend, FROM_EMAIL, isEmailEnabled } from '@/src/lib/email/client'
import { APP_URL } from '@/src/constants'

interface SlackSection {
  type: 'section'
  text: { type: 'mrkdwn'; text: string }
}
interface SlackPayload { text: string; blocks?: SlackSection[] }
async function postSlackDigest(webhookUrl: string, payload: SlackPayload): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5_000)
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    return res.ok
  } catch { return false } finally { clearTimeout(timer) }
}

export const runtime = 'nodejs'
export const maxDuration = 60

export const POST = withErrorCapture(async (request, context) => {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const testOnly = body.test_only === true

  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, slug')
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

  if (!membership) return ApiResponse.forbidden('운영진만 다이제스트를 발송할 수 있습니다')

  if (!isEmailEnabled()) {
    return ApiResponse.ok({ sent: 0, message: '이메일이 설정되지 않았습니다 (RESEND_API_KEY 필요)' })
  }

  const admin = createAdminClient()

  // 지난 7일 기간 계산
  const now = new Date()
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  // 1. 클럽 프로젝트 + 업데이트
  const oppRes = await admin
    .from('opportunities')
    .select('id, title, creator_id, cohort, created_at')
    .eq('club_id', club.id)
  const opportunities = oppRes.data ?? []

  const oppIds = opportunities.map(o => o.id)

  const [updatesRes, decisionsRes] = await Promise.all([
    oppIds.length
      ? admin
          .from('project_updates')
          .select('id, opportunity_id, author_id, week_number, created_at')
          .in('opportunity_id', oppIds)
          .order('week_number', { ascending: false })
      : Promise.resolve({ data: [] as Array<{ id: string; opportunity_id: string; author_id: string; week_number: number; created_at: string | null }> }),
    admin
      .from('team_decisions')
      .select('topic, decided_at')
      .eq('club_id', club.id)
      .gte('decided_at', weekAgo.toISOString())
      .order('decided_at', { ascending: false })
      .limit(10),
  ])

  const updates = updatesRes.data ?? []
  const decisions = decisionsRes.data ?? []

  const latestWeek = updates.reduce((max, u) => Math.max(max, u.week_number), 0)
  const submittedThisWeek = new Set(
    updates.filter(u => u.week_number === latestWeek).map(u => u.opportunity_id)
  )

  const totalTeams = opportunities.length
  const submissionRate = totalTeams > 0 ? Math.round((submittedThisWeek.size / totalTeams) * 100) : 0

  // 미제출 팀
  const pendingTeams = opportunities
    .filter(o => !submittedThisWeek.has(o.id))
    .map(o => {
      const teamUpdates = updates.filter(u => u.opportunity_id === o.id)
      const lastUpdate = teamUpdates[0]
      const daysSince = lastUpdate?.created_at
        ? Math.floor((Date.now() - new Date(lastUpdate.created_at).getTime()) / 86_400_000)
        : null
      const status: 'missing' | 'overdue' = (daysSince ?? 0) > 14 ? 'overdue' : 'missing'
      return { title: o.title, status, days_since: daysSince }
    })
    .slice(0, 10)

  // MVP — 지난 7일 내 업데이트 가장 많이 쓴 사람
  const recentUpdates = updates.filter(u => u.created_at && new Date(u.created_at) >= weekAgo)
  const countByAuthor = new Map<string, number>()
  for (const u of recentUpdates) {
    countByAuthor.set(u.author_id, (countByAuthor.get(u.author_id) ?? 0) + 1)
  }
  const topAuthorId = [...countByAuthor.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  let topContributor: { nickname: string; updates: number } | null = null
  if (topAuthorId) {
    const { data: prof } = await admin
      .from('profiles')
      .select('nickname')
      .eq('user_id', topAuthorId)
      .maybeSingle()
    if (prof?.nickname) {
      topContributor = { nickname: prof.nickname, updates: countByAuthor.get(topAuthorId) ?? 0 }
    }
  }

  // 수신자
  let recipientsQ = admin
    .from('club_members')
    .select('user_id')
    .eq('club_id', club.id)
    .in('role', ['admin', 'owner'])
    .eq('status', 'active')

  if (testOnly) recipientsQ = recipientsQ.eq('user_id', user.id)

  const { data: recipients = [] } = await recipientsQ

  const userIds = (recipients ?? []).map(r => r.user_id).filter((v): v is string => !!v)
  if (userIds.length === 0) return ApiResponse.ok({ sent: 0, message: '수신자가 없습니다' })

  const profRes = await admin
    .from('profiles')
    .select('user_id, nickname, contact_email')
    .in('user_id', userIds)
  const profiles = profRes.data ?? []

  const weekRange = `${weekAgo.toLocaleDateString('ko-KR')} ~ ${now.toLocaleDateString('ko-KR')}`
  const dashboardUrl = `${APP_URL}/clubs/${slug}/operator`

  let sent = 0
  const errors: string[] = []

  for (const p of profiles ?? []) {
    if (!p.contact_email) continue
    try {
      const html = renderOperatorDigestEmail({
        clubName: club.name,
        operatorName: p.nickname ?? '운영진',
        weekRange,
        submissionRate,
        totalTeams,
        pendingTeams,
        recentDecisions: decisions,
        topContributor,
        dashboardUrl,
      })

      await resend!.emails.send({
        from: FROM_EMAIL,
        to: p.contact_email,
        subject: `[Draft] ${club.name} 주간 운영 요약`,
        html,
      })
      sent += 1
    } catch (e) {
      errors.push(`${p.nickname ?? p.user_id}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Slack webhook으로도 발송 — test_only 일 때는 스킵 (본인 미리보기 의도)
  let slackSent = 0
  if (!testOnly) {
    const { data: slackChannels = [] } = await admin
      .from('club_notification_channels')
      .select('webhook_url, event_types, enabled')
      .eq('club_id', club.id)
      .eq('channel_type', 'slack_webhook')
      .eq('enabled', true)

    const eligibleSlack = (slackChannels ?? []).filter(c => c.event_types?.includes('announcement'))

    if (eligibleSlack.length > 0) {
      const pendingList = pendingTeams
        .slice(0, 5)
        .map(t => `• ${t.title} ${t.days_since !== null ? `(${t.days_since}일 경과)` : '(미착수)'}`)
        .join('\n')

      const body = [
        `:bar_chart: *${club.name}* 주간 운영 요약 — ${weekRange}`,
        '',
        `이번 주 제출률: *${submissionRate}%* (${totalTeams - pendingTeams.length}/${totalTeams})`,
        pendingTeams.length > 0 ? `:warning: 미제출 ${pendingTeams.length}팀` : ':white_check_mark: 모든 팀 제출 완료',
        pendingList ? `\n${pendingList}` : '',
        topContributor ? `\n:star: 이번 주 MVP: *${topContributor.nickname}* (${topContributor.updates}건 작성)` : '',
        decisions.length > 0 ? `\n:memo: 기록된 의사결정 ${decisions.length}건` : '',
        `\n<${dashboardUrl}|운영 대시보드 열기>`,
      ].filter(Boolean).join('\n')

      await Promise.allSettled(
        eligibleSlack.map(ch =>
          postSlackDigest(ch.webhook_url, {
            text: `${club.name} 주간 운영 요약`,
            blocks: [{ type: 'section', text: { type: 'mrkdwn', text: body } }],
          }).then(ok => { if (ok) slackSent += 1 })
        )
      )
    }
  }

  return ApiResponse.ok({ sent, slack_sent: slackSent, total_recipients: profiles.length, errors })
})
