import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'

// POST: Register email to waitlist
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = validateRequired(body, ['email'])

    if (!validation.valid) {
      return ApiResponse.badRequest(`필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`)
    }

    const { email, currentSituation } = body

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return ApiResponse.badRequest('유효한 이메일 주소를 입력해주세요')
    }

    // Validate currentSituation if provided
    const validSituations = ['solo_want_team', 'has_project_need_member', 'want_to_join', 'just_curious']
    if (currentSituation && !validSituations.includes(currentSituation)) {
      return ApiResponse.badRequest('유효하지 않은 상황 선택입니다')
    }

    const supabase = createAdminClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist_signups')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return ApiResponse.badRequest('이미 등록된 이메일입니다')
    }

    // Insert new signup
    const { error: insertError } = await supabase
      .from('waitlist_signups')
      .insert({
        email,
        current_situation: currentSituation || null,
      })

    if (insertError) {
      console.error('Waitlist insert error:', insertError)
      return ApiResponse.internalError('등록에 실패했습니다', insertError.message)
    }

    // Get current position (total count)
    const { data: countData, error: countError } = await supabase.rpc('get_waitlist_count')

    if (countError) {
      console.error('Waitlist count error:', countError)
      // Still return success even if count fails
      return ApiResponse.created({ success: true, position: null })
    }

    return ApiResponse.created({ success: true, position: countData })
  } catch (error) {
    console.error('Waitlist POST error:', error)
    return ApiResponse.internalError(
      '등록 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}

// GET: Get waitlist count
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('get_waitlist_count')

    if (error) {
      console.error('Waitlist count error:', error)
      return ApiResponse.internalError('대기자 수를 가져오는데 실패했습니다', error.message)
    }

    return ApiResponse.ok({ count: data || 0 })
  } catch (error) {
    console.error('Waitlist GET error:', error)
    return ApiResponse.internalError(
      '대기자 수 조회 중 오류가 발생했습니다',
      error instanceof Error ? error.message : undefined
    )
  }
}
