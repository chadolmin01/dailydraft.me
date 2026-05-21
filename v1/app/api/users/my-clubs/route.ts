import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET /api/users/my-clubs — 내 소속 클럽 목록
export const GET = withErrorCapture(
  async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 내 멤버십 조회 (active만)
    const { data: memberships, error } = await supabase
      .from('club_members')
      .select('club_id, role, display_role, cohort, joined_at')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin', 'member'])
      .order('joined_at', { ascending: false })

    if (error) return ApiResponse.internalError(error.message)
    if (!memberships || memberships.length === 0) return ApiResponse.ok([])

    const clubIds = memberships.map(m => m.club_id)

    // 클럽 정보 일괄 조회
    const { data: clubs } = await supabase
      .from('clubs')
      .select('id, slug, name, description, logo_url, category')
      .in('id', clubIds)

    // 각 클럽별 멤버 수
    const countPromises = clubIds.map(async (clubId) => {
      const { count } = await supabase
        .from('club_members')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', clubId)
      return { clubId, count: count ?? 0 }
    })
    const counts = await Promise.all(countPromises)
    const countMap = Object.fromEntries(counts.map(c => [c.clubId, c.count]))

    const clubMap = Object.fromEntries((clubs || []).map(c => [c.id, c]))

    const result = memberships.map(m => {
      const club = clubMap[m.club_id]
      if (!club) return null
      return {
        slug: club.slug,
        name: club.name,
        description: club.description,
        logo_url: club.logo_url,
        category: club.category,
        role: m.role,
        display_role: m.display_role,
        cohort: m.cohort,
        member_count: countMap[m.club_id] ?? 0,
      }
    }).filter(Boolean)

    return ApiResponse.ok(result)
  }
)
