import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { NextRequest } from 'next/server'
import { getInstitutionId, isAssignableRole } from '@/src/lib/institution/auth'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return ApiResponse.unauthorized()

  const institutionId = await getInstitutionId(supabase, user.id)
  if (!institutionId) return ApiResponse.forbidden('기관 관리자 권한이 필요합니다')

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = (page - 1) * limit

  // When search is provided, first find matching user_ids from profiles
  let searchUserIds: string[] | null = null
  if (search) {
    // Escape LIKE special characters to prevent wildcard injection
    const escapedSearch = search.replace(/%/g, '\\%').replace(/_/g, '\\_')
    const { data: matchingProfiles } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('nickname', `%${escapedSearch}%`)

    searchUserIds = (matchingProfiles || []).map((p) => p.user_id)
    if (searchUserIds.length === 0) {
      return ApiResponse.ok({ members: [], total: 0, page, limit })
    }
  }

  let query = supabase
    .from('institution_members')
    .select(`
      id,
      user_id,
      role,
      status,
      joined_at,
      notes
    `, { count: 'exact' })
    .eq('institution_id', institutionId)
    .eq('status', 'active')

  if (role !== 'all') {
    query = query.eq('role', role)
  }

  // Filter by matching user_ids when searching
  if (searchUserIds) {
    query = query.in('user_id', searchUserIds)
  }

  query = query.order('joined_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data: members, count, error } = await query

  if (error) throw error

  // Fetch profiles for the returned members
  const memberUserIds = (members || []).map((m) => m.user_id)
  const profiles: Record<string, any> = {}
  if (memberUserIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, nickname, university, major, skills, interest_tags, current_situation, onboarding_completed, created_at')
      .in('user_id', memberUserIds)

    ;(profileData || []).forEach((p) => { profiles[p.user_id] = p })
  }

  const enrichedMembers = (members || []).map((m) => ({
    ...m,
    profiles: profiles[m.user_id] || null,
  }))

  return ApiResponse.ok({
    members: enrichedMembers,
    total: count || 0,
    page,
    limit,
  })
})

export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return ApiResponse.unauthorized()

  const institutionId = await getInstitutionId(supabase, user.id)
  if (!institutionId) return ApiResponse.forbidden('기관 관리자 권한이 필요합니다')

  const body = await request.json()
  const { email, role = 'student', notes } = body

  if (!email) return ApiResponse.badRequest('이메일을 입력해주세요')

  // Role validation: prevent escalation to admin
  if (!isAssignableRole(role)) {
    return ApiResponse.badRequest('유효하지 않은 역할입니다. student 또는 mentor만 지정할 수 있습니다.')
  }

  // Notes length validation
  const sanitizedNotes = typeof notes === 'string' ? notes.slice(0, 500).trim() || null : null

  // Find user by email (maybeSingle: contact_email is not unique)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('contact_email', email)
    .limit(2)

  if (!profiles || profiles.length === 0) {
    return ApiResponse.notFound('해당 이메일로 가입한 사용자를 찾을 수 없습니다')
  }
  if (profiles.length > 1) {
    return ApiResponse.badRequest('동일 이메일의 사용자가 여러 명입니다. 관리자에게 문의해주세요.')
  }
  const profile = profiles[0]

  // Check duplicate
  const { data: existing } = await supabase
    .from('institution_members')
    .select('id')
    .eq('institution_id', institutionId)
    .eq('user_id', profile.user_id)
    .limit(1)
    .single()

  if (existing) {
    return ApiResponse.badRequest('이미 소속된 멤버입니다')
  }

  const { data: member, error } = await supabase
    .from('institution_members')
    .insert({
      institution_id: institutionId,
      user_id: profile.user_id,
      role,
      notes: sanitizedNotes,
    })
    .select()
    .single()

  if (error) throw error

  return ApiResponse.created(member)
})
