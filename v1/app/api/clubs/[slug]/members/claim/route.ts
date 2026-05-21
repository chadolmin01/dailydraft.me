import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, isValidUUID } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET /api/clubs/[slug]/members/claim — 클레임 가능한 ghost 목록 (본인용)
// 유저가 "이전 기수에서 활동했어요" 선택 시 ghost 후보 표시
// ghost_name을 노출해야 본인이 찾을 수 있으므로, 인증 유저+클럽 멤버에게만 제공
export const GET = withErrorCapture(
  async (_request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 클럽 확인
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 요청자가 클럽 멤버인지 확인
    const { data: membership } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return ApiResponse.forbidden('이 클럽의 멤버만 조회할 수 있습니다')
    }

    // 클레임 가능한 ghost 목록 (user_id가 NULL인 멤버)
    const { data: ghosts, error } = await supabase
      .from('club_members')
      .select('id, ghost_name, ghost_metadata, cohort, role')
      .eq('club_id', club.id)
      .is('user_id', null)
      .order('cohort', { ascending: true })
      .order('ghost_name', { ascending: true })

    if (error) return ApiResponse.internalError(error.message)

    // ghost_name은 여기서만 노출 (일반 멤버 목록 GET에서는 익명)
    const result = (ghosts || []).map(g => ({
      id: g.id,
      name: g.ghost_name,
      cohort: g.cohort,
      department: (g.ghost_metadata as Record<string, unknown>)?.department || null,
    }))

    return ApiResponse.ok({ ghosts: result })
  }
)

// POST /api/clubs/[slug]/members/claim — Ghost 멤버를 실제 유저로 클레임
//
// 흐름:
// 1. 유저가 클럽에 가입 (초대코드 or admin 추가)
// 2. "이전 기수에서 활동한 기록이 있으신가요?" → ghost 목록 표시
// 3. 유저가 본인 ghost 선택 → 이 API 호출
// 4. ghost의 user_id를 실유저로 채움 + 기존 실멤버 레코드에 ghost 메타 병합
//
// 보안:
// - 본인만 클레임 가능 (auth.uid())
// - 이미 user_id가 있는 ghost는 클레임 불가 (선점 방지)
// - 같은 클럽 멤버여야 클레임 가능
export const POST = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json()
    const ghostMemberId = body.ghost_member_id?.trim()

    if (!ghostMemberId || !isValidUUID(ghostMemberId)) {
      return ApiResponse.badRequest('클레임할 멤버 ID가 필요합니다')
    }

    // 1. 클럽 확인
    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // 2. 요청자가 이 클럽의 실멤버인지 확인
    const { data: myMembership } = await supabase
      .from('club_members')
      .select('id, cohort')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!myMembership) {
      return ApiResponse.forbidden('이 클럽의 멤버만 클레임할 수 있습니다')
    }

    // 3. ghost 멤버 조회
    const { data: ghost } = await supabase
      .from('club_members')
      .select('id, user_id, ghost_name, ghost_metadata, cohort, role')
      .eq('id', ghostMemberId)
      .eq('club_id', club.id)
      .maybeSingle()

    if (!ghost) {
      return ApiResponse.notFound('해당 멤버를 찾을 수 없습니다')
    }

    // 4. 이미 실유저가 연결된 ghost는 클레임 불가
    if (ghost.user_id) {
      return ApiResponse.badRequest('이미 클레임된 멤버입니다')
    }

    // 5. 클레임 처리: ghost 레코드에 user_id 설정 + 기존 실멤버 레코드 병합
    //    - ghost의 cohort/메타를 보존 (과거 기수 기록)
    //    - 현재 실멤버 레코드는 삭제하고 ghost를 "승격"
    //    의도: ghost에 담긴 과거 기수(cohort) 정보를 유지하기 위함.
    //    실멤버 레코드가 현재 기수, ghost가 과거 기수면 둘 다 보존하는 게 이상적이지만,
    //    1기에서는 단순하게 ghost를 실유저로 전환하고, 실멤버 레코드는 병합 삭제.

    // 기존 실멤버 레코드 삭제 (ghost로 대체)
    await supabase
      .from('club_members')
      .delete()
      .eq('id', myMembership.id)

    // ghost → 실유저 전환
    const { data: claimed, error } = await supabase
      .from('club_members')
      .update({
        user_id: user.id,
        // ghost_name, ghost_metadata는 DB에 유지 (히스토리용)
      })
      .eq('id', ghost.id)
      .select()
      .single()

    if (error) {
      // 롤백: 실멤버 레코드 복구 시도
      // 트랜잭션이 아니므로 완벽하지 않지만, 최선의 복구
      await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: user.id,
          role: 'member',
          cohort: myMembership.cohort,
        })
      return ApiResponse.internalError(error.message)
    }

    return ApiResponse.ok({
      claimed_member_id: claimed.id,
      cohort: claimed.cohort,
      ghost_name: ghost.ghost_name,
      message: '클레임이 완료되었습니다',
    })
  }
)
