import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase.rpc('find_similar_opportunities', {
    p_opportunity_id: id,
    p_match_count: 3,
    p_match_threshold: 0.5,
  })

  if (error) {
    return ApiResponse.internalError('유사 프로젝트 검색에 실패했습니다')
  }

  return ApiResponse.ok(data || [])
})
