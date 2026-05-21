import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: Get current user's profile
export const GET = withErrorCapture(async () => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return ApiResponse.notFound('프로필을 찾을 수 없습니다')
    }

    return ApiResponse.ok(data)
})

// PATCH: Update profile
export const PATCH = withErrorCapture(async (request) => {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()

    // Whitelist allowed fields to prevent mass assignment attacks
    const allowedFields = [
      'nickname',
      'bio',
      'age_range',
      'university',
      'major',
      'graduation_year',
      'locations',
      'skills',
      'interest_tags',
      'desired_position',
      'personality',
      'vision_summary',
      'contact_email',
      'contact_kakao',
      'portfolio_url',
      'linkedin_url',
      'github_url',
      'avatar_url',
      'cover_image_url',
      'current_situation',
      'affiliation_type',
    ]

    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return ApiResponse.badRequest('업데이트할 항목이 없습니다')
    }

    const { data, error } = await supabase.from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError('프로필 업데이트에 실패했습니다')
    }

    return ApiResponse.ok(data)
})
