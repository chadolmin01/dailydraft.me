import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// PATCH: Update a portfolio item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { id } = await params
    const body = await request.json()

    const allowedFields = ['title', 'description', 'image_url', 'link_url', 'display_order']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (key in body) {
        updateData[key] = body[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return ApiResponse.badRequest('업데이트할 항목이 없습니다')
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase.from('portfolio_items')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return ApiResponse.internalError(error.message)
    }

    if (!data) {
      return ApiResponse.notFound('포트폴리오 항목을 찾을 수 없습니다')
    }

    return ApiResponse.ok(data)
  } catch {
    return ApiResponse.internalError('포트폴리오 수정 중 오류가 발생했습니다')
  }
}

// DELETE: Delete a portfolio item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiResponse.unauthorized()
    }

    const { id } = await params

    const { error } = await supabase.from('portfolio_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return ApiResponse.internalError(error.message)
    }

    return ApiResponse.ok({ success: true })
  } catch {
    return ApiResponse.internalError('포트폴리오 삭제 중 오류가 발생했습니다')
  }
}
