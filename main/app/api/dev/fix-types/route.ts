import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async () => {
  if (process.env.NODE_ENV === 'production') {
    return ApiResponse.forbidden('Not available in production')
  }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, title, type, status')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('dev/fix-types GET error:', error.message)
      return ApiResponse.internalError()
    }

    return ApiResponse.ok({ count: data?.length, opportunities: data })
})

export const POST = withErrorCapture(async (request) => {
  if (process.env.NODE_ENV === 'production') {
    return ApiResponse.forbidden('Not available in production')
  }

    const supabase = createAdminClient()
    const body = await request.json()

    // 배치 업데이트: [{ id, type?, demo_images?, ... }] 배열
    if (body.batch && Array.isArray(body.batch)) {
      const results = []
      for (const item of body.batch) {
        const { id, ...updates } = item
        const { data, error } = await supabase
          .from('opportunities')
          .update(updates)
          .eq('id', id)
          .select('id, title, type, demo_images')
          .single()

        if (error) {
          results.push({ id: item.id, error: error.message })
        } else {
          results.push(data)
        }
      }
      return ApiResponse.ok({ updated: results })
    }

    // 새 프로젝트 생성
    if (body.create && Array.isArray(body.create)) {
      const results = []
      for (const item of body.create) {
        const { data, error } = await supabase
          .from('opportunities')
          .insert(item)
          .select('id, title, type')
          .single()

        if (error) {
          results.push({ title: item.title, error: error.message })
        } else {
          results.push(data)
        }
      }
      return ApiResponse.ok({ created: results })
    }

    return ApiResponse.badRequest('Provide batch or create array')
})
