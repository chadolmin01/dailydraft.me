/**
 * GET /api/users/operator-pending — 내가 admin/owner 인 모든 클럽의 이번주 미제출 팀 수 집계.
 *
 * 대시보드에서 다중 클럽 운영자가 한눈에 어느 클럽이 밀려있는지 파악할 수 있도록.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data: memberships } = await supabase
    .from('club_members')
    .select('club_id')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin'])
    .eq('status', 'active')

  const clubIds = (memberships ?? [])
    .map(m => m.club_id)
    .filter((v): v is string => typeof v === 'string')

  if (clubIds.length === 0) return ApiResponse.ok([])

  const admin = createAdminClient()

  const { data: clubs } = await admin
    .from('clubs')
    .select('id, slug, name')
    .in('id', clubIds)

  const { data: opps } = await admin
    .from('opportunities')
    .select('id, club_id, created_at')
    .in('club_id', clubIds)
    .eq('status', 'active')

  const oppIds = (opps ?? []).map(o => o.id)
  if (oppIds.length === 0) {
    return ApiResponse.ok(
      (clubs ?? []).map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        total_teams: 0,
        pending_count: 0,
      }))
    )
  }

  const { data: updates } = await admin
    .from('project_updates')
    .select('opportunity_id, week_number')
    .in('opportunity_id', oppIds)
    .order('week_number', { ascending: false })

  const latestWeek = (updates ?? []).reduce((max, u) => Math.max(max, u.week_number ?? 0), 0)
  const submittedIds = new Set(
    (updates ?? []).filter(u => u.week_number === latestWeek).map(u => u.opportunity_id)
  )

  const oppsByClub = new Map<string, string[]>()
  for (const o of opps ?? []) {
    if (!o.club_id) continue
    const arr = oppsByClub.get(o.club_id) ?? []
    arr.push(o.id)
    oppsByClub.set(o.club_id, arr)
  }

  const result = (clubs ?? []).map(c => {
    const teams = oppsByClub.get(c.id) ?? []
    const pending = teams.filter(id => !submittedIds.has(id)).length
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      total_teams: teams.length,
      pending_count: pending,
    }
  }).filter(r => r.total_teams > 0 || r.pending_count > 0)

  return ApiResponse.ok(result)
})
