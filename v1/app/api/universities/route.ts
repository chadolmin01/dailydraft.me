import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const runtime = 'nodejs'

/**
 * GET /api/universities?q=
 *
 * 대학 검색 — /clubs/new 등록 폼, 프로필 학교 변경 등에서 자동완성용.
 * 인증 불요 (공개 레퍼런스 데이터).
 *
 * q 가 공백이면 상위 50개. 있으면 ilike 검색.
 */
export const GET = withErrorCapture(async (request) => {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(Number(searchParams.get('limit')) || 30, 100)

  const supabase = await createClient()

  let query = supabase
    .from('universities')
    .select('id, name, short_name, email_domains')
    .order('name', { ascending: true })
    .limit(limit)

  if (q) {
    query = query.or(`name.ilike.%${q}%,short_name.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return ApiResponse.internalError('조회 실패', error.message)

  return ApiResponse.ok({ items: data ?? [] })
})
