import { NextRequest } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// PATCH: Update a portfolio item
export const PATCH = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
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
      return ApiResponse.internalError('포트폴리오 수정에 실패했습니다', error.message)
    }

    if (!data) {
      return ApiResponse.notFound('포트폴리오 항목을 찾을 수 없습니다')
    }

    return ApiResponse.ok(data)
})

// DELETE: Delete a portfolio item
export const DELETE = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
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
      return ApiResponse.internalError('포트폴리오 삭제에 실패했습니다', error.message)
    }

    return ApiResponse.ok({ success: true })
})
