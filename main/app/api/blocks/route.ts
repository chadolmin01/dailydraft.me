import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET: 내가 차단한 사용자 목록
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data, error } = await supabase
      .from('user_blocks')
      .select('*')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01') return ApiResponse.ok({ blocks: [] })
      console.error('Block list error:', error.message)
      return ApiResponse.internalError()
    }
    return ApiResponse.ok({ blocks: data || [] })
  } catch (e) {
    console.error('Block list error:', e)
    return ApiResponse.internalError()
  }
}

// POST: 차단 생성. body: { blocked_id, reason? }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json()
    const { blocked_id, reason } = body
    if (!blocked_id) return ApiResponse.badRequest('대상 사용자가 지정되지 않았습니다')
    if (blocked_id === user.id) return ApiResponse.badRequest('자기 자신은 차단할 수 없습니다')

    const { error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: user.id,
        blocked_id,
        reason: typeof reason === 'string' ? reason.slice(0, 500) : null,
      })

    // 이미 차단된 경우 (UNIQUE 위반) 멱등 처리
    if (error && !error.message.includes('duplicate')) {
      console.error('Block insert error:', error.message)
      return ApiResponse.internalError()
    }
    return ApiResponse.ok({ success: true })
  } catch (e) {
    console.error('Block insert error:', e)
    return ApiResponse.internalError()
  }
}

// DELETE: 차단 해제. ?blocked_id=
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { searchParams } = new URL(request.url)
    const blockedId = searchParams.get('blocked_id')
    if (!blockedId) return ApiResponse.badRequest('대상 사용자가 지정되지 않았습니다')

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedId)

    if (error) {
      console.error('Block delete error:', error.message)
      return ApiResponse.internalError()
    }
    return ApiResponse.ok({ success: true })
  } catch (e) {
    console.error('Block delete error:', e)
    return ApiResponse.internalError()
  }
}
