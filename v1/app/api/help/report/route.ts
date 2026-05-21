import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { NextRequest } from 'next/server'

export const POST = withErrorCapture(async (request: NextRequest) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await request.json()
  const { category, title, description, pageUrl } = body as {
    category: string
    title: string
    description: string
    pageUrl?: string
  }

  if (!category || !title?.trim() || !description?.trim()) {
    return ApiResponse.badRequest('카테고리, 제목, 내용은 필수입니다')
  }

  if (!['bug', 'feature', 'question', 'other'].includes(category)) {
    return ApiResponse.badRequest('Invalid category')
  }

  const { error } = await supabase.from('help_reports' as any).insert({
    user_id: user.id,
    category,
    title: title.trim().slice(0, 200),
    description: description.trim().slice(0, 5000),
    page_url: pageUrl?.slice(0, 500) || null,
  })

  if (error) {
    console.error('Report insert error:', error)
    return ApiResponse.internalError('리포트 저장에 실패했습니다')
  }

  return ApiResponse.ok({ success: true, message: '리포트가 접수되었습니다' })
})

export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const { data, error } = await supabase.from('help_reports' as any)
    .select('id, category, title, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error

  return ApiResponse.ok({ tickets: data || [] })
})
