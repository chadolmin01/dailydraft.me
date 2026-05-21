import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/project-updates/recent
 *
 * 전체 공개 주간 업데이트 최신순 조회.
 * project_updates → auth.users FK라서 profiles 직접 JOIN 불가.
 * opportunities JOIN + profiles/clubs 별도 조회로 처리.
 *
 * Query params:
 *   limit  — 가져올 개수 (기본 10, 최대 30)
 */
export const GET = withErrorCapture(async (request) => {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 10, 30)

  const admin = createAdminClient()

  // 1) project_updates + opportunities JOIN
  const { data, error } = await admin
    .from('project_updates')
    .select(`
      id, opportunity_id, author_id, week_number,
      title, content, update_type, created_at,
      opportunities!inner ( title, club_id, interest_tags )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[project-updates/recent]', error.message)
    return ApiResponse.internalError('업데이트 목록을 불러오는 데 실패했습니다')
  }

  const rows = data ?? []
  if (rows.length === 0) return ApiResponse.ok([])

  // 2) 작성자 프로필 일괄 조회 (author_id → profiles.user_id)
  const authorIds = [...new Set(rows.map((r) => r.author_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('user_id, nickname, avatar_url')
    .in('user_id', authorIds)

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.user_id, p])
  )

  // 3) 클럽 이름 일괄 조회
  const clubIds = [...new Set(
    rows
      .map((r) => (r.opportunities as { club_id?: string | null })?.club_id)
      .filter((id): id is string => id != null)
  )]

  let clubMap = new Map<string, string>()
  if (clubIds.length > 0) {
    const { data: clubs } = await admin
      .from('clubs')
      .select('id, name')
      .in('id', clubIds)

    if (clubs) {
      clubMap = new Map(clubs.map((c) => [c.id, c.name]))
    }
  }

  // 4) 응답 조립
  const items = rows.map((row) => {
    const opp = row.opportunities as { title?: string; club_id?: string | null; interest_tags?: string[] } | null
    const author = profileMap.get(row.author_id)
    const clubId = opp?.club_id
    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      week_number: row.week_number,
      title: row.title,
      content: row.content,
      update_type: row.update_type,
      created_at: row.created_at,
      project_title: opp?.title ?? null,
      project_tags: opp?.interest_tags ?? [],
      club_name: clubId ? (clubMap.get(clubId) ?? null) : null,
      author_nickname: author?.nickname ?? null,
      author_avatar_url: author?.avatar_url ?? null,
    }
  })

  return ApiResponse.ok(items)
})
