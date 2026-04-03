import { createClient } from '@/src/lib/supabase/server'
import { generateOpportunityEmbedding } from '@/src/lib/ai/embeddings'
import { ApiResponse } from '@/src/lib/api-utils'

// POST /api/admin/backfill-embeddings
// 임베딩 없는 프로젝트 전체에 임베딩 생성 후 저장
export async function POST(request: Request) {
  // 간단한 비밀키 인증
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return ApiResponse.unauthorized()
  }

  const supabase = await createClient()

  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('id, title, description, needed_roles, needed_skills, interest_tags')
    .is('vision_embedding', null)

  if (error) return ApiResponse.internalError('조회 실패')
  if (!opportunities || opportunities.length === 0) {
    return ApiResponse.ok({ message: '백필할 프로젝트 없음', count: 0 })
  }

  const results = { success: 0, failed: 0, ids: [] as string[] }

  for (const opp of opportunities) {
    try {
      const embedding = await generateOpportunityEmbedding({
        title: opp.title,
        description: opp.description,
        neededRoles: opp.needed_roles ?? [],
        neededSkills: opp.needed_skills as Array<{ name: string; level: string }> ?? [],
        interestTags: opp.interest_tags ?? [],
      })

      await supabase
        .from('opportunities')
        .update({ vision_embedding: JSON.stringify(embedding) })
        .eq('id', opp.id)

      results.success++
      results.ids.push(opp.id)
    } catch {
      results.failed++
    }
  }

  return ApiResponse.ok({
    message: `백필 완료: ${results.success}개 성공, ${results.failed}개 실패`,
    ...results,
  })
}
