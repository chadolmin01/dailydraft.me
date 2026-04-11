import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/clubs/[slug]/members/pending — 승인 대기 멤버 목록
 *
 * require_approval이 켜진 클럽에서 가입한 멤버들.
 * admin/owner만 조회 가능.
 */
export const GET = withErrorCapture(
  async (_request, context) => {
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

    // admin 권한 확인
    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle()

    if (!membership) {
      return ApiResponse.forbidden('관리자만 조회할 수 있습니다')
    }

    // pending 멤버 목록 (프로필 포함)
    // status: 마이그레이션 적용 후 타입 재생성하면 정상화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pending, error } = await (supabase as any)
      .from('club_members')
      .select('id, user_id, cohort, joined_at')
      .eq('club_id', club.id)
      .eq('status', 'pending')
      .order('joined_at', { ascending: true })

    if (error) return ApiResponse.internalError(error.message)

    // 프로필 enrichment
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = (pending || []).map((m: any) => m.user_id).filter(Boolean) as string[]
    let profiles: Record<string, { nickname: string; avatar_url: string | null; desired_position: string | null }> = {}

    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url, desired_position')
        .in('user_id', userIds)

      profiles = Object.fromEntries(
        (profileData || []).map(p => [p.user_id, p])
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (pending || []).map((m: any) => ({
      ...m,
      profile: m.user_id ? profiles[m.user_id] || null : null,
    }))

    return ApiResponse.ok({ pending: result, count: result.length })
  }
)
