import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET: Fetch portfolio items for a user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || user.id

    const { data, error } = await supabase.from('portfolio_items')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    if (error) {
      // Table might not exist yet (migration not applied)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return ApiResponse.ok([])
      }
      return ApiResponse.internalError('포트폴리오를 조회할 수 없습니다', error.message)
    }

    return ApiResponse.ok(data || [])
  } catch {
    return ApiResponse.internalError('포트폴리오 조회 중 오류가 발생했습니다')
  }
}

// POST: Create a new portfolio item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const body = await request.json()
    const { title, description, image_url, link_url, display_order } = body

    if (!title?.trim()) {
      return ApiResponse.badRequest('제목은 필수입니다')
    }

    const { data, error } = await supabase.from('portfolio_items')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        image_url: image_url || null,
        link_url: link_url?.trim() || null,
        display_order: display_order ?? 0,
      })
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError('포트폴리오 생성에 실패했습니다', error.message)
    }

    return ApiResponse.created(data)
  } catch {
    return ApiResponse.internalError('포트폴리오 생성 중 오류가 발생했습니다')
  }
}
