import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET /api/clubs/[slug] — 클럽 상세 조회 (공개)
export const GET = withErrorCapture(
  async (_request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: club, error } = await supabase
      .from('clubs')
      .select(`
        id, slug, name, description, logo_url,
        created_by, created_at, updated_at
      `)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      return ApiResponse.internalError(error.message)
    }
    if (!club) {
      return ApiResponse.notFound('클럽을 찾을 수 없습니다')
    }

    // 멤버 수 (real + ghost)
    const { count: memberCount } = await supabase
      .from('club_members')
      .select('id', { count: 'exact', head: true })
      .eq('club_id', club.id)

    // 기수 목록
    const { data: cohorts } = await supabase
      .from('club_members')
      .select('cohort')
      .eq('club_id', club.id)
      .not('cohort', 'is', null)

    const uniqueCohorts = [...new Set((cohorts || []).map(c => c.cohort))]
      .filter(Boolean)
      .sort()

    // 뱃지 (credentials)
    const { data: credentials } = await supabase
      .from('club_credentials')
      .select(`
        id, credential_type, verification_method, verified_at,
        university_id
      `)
      .eq('club_id', club.id)

    // university 이름 조회 (credentials에 university_id가 있는 경우)
    const universityIds = (credentials || [])
      .map(c => c.university_id)
      .filter(Boolean) as string[]

    let universities: Record<string, { name: string; short_name: string | null }> = {}
    if (universityIds.length > 0) {
      const { data: univData } = await supabase
        .from('universities')
        .select('id, name, short_name')
        .in('id', universityIds)

      universities = Object.fromEntries(
        (univData || []).map(u => [u.id, { name: u.name, short_name: u.short_name }])
      )
    }

    const badges = (credentials || []).map(c => ({
      id: c.id,
      type: c.credential_type,
      method: c.verification_method,
      verified_at: c.verified_at,
      university: c.university_id ? universities[c.university_id] : null,
    }))

    // owner 프로필
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('user_id, nickname, avatar_url')
      .eq('user_id', club.created_by)
      .maybeSingle()

    return ApiResponse.ok({
      ...club,
      member_count: memberCount ?? 0,
      cohorts: uniqueCohorts,
      badges,
      owner: ownerProfile || { user_id: club.created_by, nickname: null, avatar_url: null },
    })
  }
)
