import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { NextRequest } from 'next/server'
import { getInstitutionId, isAssignableRole } from '@/src/lib/institution/auth'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/** PATCH — 멤버 역할 변경 */
export const PATCH = withErrorCapture(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const institutionId = await getInstitutionId(supabase, user.id)
  if (!institutionId) return ApiResponse.forbidden('기관 관리자 권한이 필요합니다')

  const { id: memberId } = await params
  const body = await request.json()
  const { role } = body

  if (!role) return ApiResponse.badRequest('역할을 지정해주세요')
  if (!isAssignableRole(role)) {
    return ApiResponse.badRequest('유효하지 않은 역할입니다. student 또는 mentor만 지정할 수 있습니다.')
  }

  // 해당 멤버가 자기 기관 소속인지 확인
  const { data: member } = await supabase
    .from('institution_members')
    .select('id, institution_id, role')
    .eq('id', memberId)
    .eq('institution_id', institutionId)
    .single()

  if (!member) return ApiResponse.notFound('해당 멤버를 찾을 수 없습니다')

  // admin 역할의 멤버는 변경 불가
  if (member.role === 'admin') {
    return ApiResponse.forbidden('관리자 역할은 변경할 수 없습니다')
  }

  const { data, error } = await supabase
    .from('institution_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return ApiResponse.ok(data)
})

/** DELETE — 멤버 제거 */
export const DELETE = withErrorCapture(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const institutionId = await getInstitutionId(supabase, user.id)
  if (!institutionId) return ApiResponse.forbidden('기관 관리자 권한이 필요합니다')

  const { id: memberId } = await params

  // 해당 멤버가 자기 기관 소속인지 확인
  const { data: member } = await supabase
    .from('institution_members')
    .select('id, institution_id, user_id, role')
    .eq('id', memberId)
    .eq('institution_id', institutionId)
    .single()

  if (!member) return ApiResponse.notFound('해당 멤버를 찾을 수 없습니다')

  // 자기 자신은 제거 불가
  if (member.user_id === user.id) {
    return ApiResponse.badRequest('자기 자신은 제거할 수 없습니다')
  }

  // admin 역할의 멤버는 제거 불가
  if (member.role === 'admin') {
    return ApiResponse.forbidden('관리자는 제거할 수 없습니다')
  }

  const { error } = await supabase
    .from('institution_members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
  return ApiResponse.ok({ deleted: true })
})
