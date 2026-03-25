import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { data: membership } = await supabase
      .from('institution_members')
      .select(`
        role,
        institution_id,
        institutions ( name )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (!membership) {
      return ApiResponse.ok(null)
    }

    return ApiResponse.ok({
      institutionId: membership.institution_id,
      institutionName: (membership.institutions as any)?.name ?? '',
      role: membership.role,
    })
  } catch (error) {
    console.error('[Institution me] Error:', error)
    return ApiResponse.internalError('기관 정보 조회 중 오류가 발생했습니다')
  }
}
