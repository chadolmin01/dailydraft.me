import { createClient } from '@/src/lib/supabase/server'
import { generateOpportunityEmbedding } from '@/src/lib/ai/embeddings'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import {
  checkOpportunityLimit,
  incrementOpportunityUsage,
} from '@/src/lib/subscription/usage-checker'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { captureServerEvent } from '@/src/lib/posthog/server'
import { postSignal } from '@/src/lib/alerts/discord-signals'

// Boost type priority for sorting
const BOOST_PRIORITY: Record<string, number> = {
  weekly_feature: 1,
  opportunity_premium: 2,
  opportunity_boost: 3,
}

// GET: List opportunities with filters
export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const type = searchParams.get('type')
  const tags = searchParams.get('tags')?.split(',').filter(Boolean)
  const location = searchParams.get('location')
  const sort = searchParams.get('sort') || 'recent'
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam) || 50, 100) : 50

  const { data: boostedOpportunities } = await supabase.rpc('get_boosted_opportunities')
  const boostedIds = new Set((boostedOpportunities || []).map((b: { opportunity_id: string }) => b.opportunity_id))
  const boostTypeMap = new Map(
    (boostedOpportunities || []).map((b: { opportunity_id: string; boost_type: string }) => [b.opportunity_id, b.boost_type])
  )

  let query = supabase
    .from('opportunities')
    .select('id, type, title, description, status, creator_id, needed_roles, needed_skills, interest_tags, location_type, location, time_commitment, compensation_type, compensation_details, applications_count, views_count, created_at, updated_at')
    .eq('status', 'active')

  if (type && ['side_project', 'startup', 'study'].includes(type)) {
    query = query.eq('type', type)
  }

  if (tags && tags.length > 0) {
    query = query.overlaps('interest_tags', tags)
  }

  if (location) {
    query = query.eq('location', location)
  }

  if (sort === 'popular') {
    query = query.order('applications_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) {
    return ApiResponse.internalError('Opportunity 목록을 가져오는데 실패했습니다')
  }

  const sortedData = (data || []).map((opp) => ({
    ...opp,
    is_boosted: boostedIds.has(opp.id),
    boost_type: boostTypeMap.get(opp.id) || null,
  })).sort((a, b) => {
    if (a.is_boosted && !b.is_boosted) return -1
    if (!a.is_boosted && b.is_boosted) return 1
    if (a.is_boosted && b.is_boosted) {
      const priorityA = BOOST_PRIORITY[a.boost_type as string] || 99
      const priorityB = BOOST_PRIORITY[b.boost_type as string] || 99
      if (priorityA !== priorityB) return priorityA - priorityB
    }
    return 0
  })

  return ApiResponse.ok(sortedData)
})

// POST: Create new opportunity
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const body = await request.json()

  const validation = validateRequired(body, ['type', 'title', 'description'])
  if (!validation.valid) {
    return ApiResponse.badRequest(`필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`)
  }

  if (!['side_project', 'startup', 'study'].includes(body.type)) {
    return ApiResponse.badRequest('type은 "side_project", "startup", "study"만 가능합니다')
  }

  if (body.title.length < 5 || body.title.length > 100) {
    return ApiResponse.badRequest('제목은 5자 이상 100자 이하여야 합니다')
  }

  if (body.description.length < 20) {
    return ApiResponse.badRequest('설명은 20자 이상이어야 합니다')
  }

  const limitCheck = await checkOpportunityLimit(supabase, user.id)
  if (!limitCheck.allowed) {
    return ApiResponse.forbidden(
      limitCheck.message ||
        '활성 Opportunity 개수가 최대입니다. 기존 Opportunity를 마감하거나 업그레이드하세요.'
    )
  }

  // Inner try/catch: embedding failure shouldn't fail creation
  let embedding = null
  try {
    embedding = await generateOpportunityEmbedding({
      title: body.title,
      description: body.description,
      neededRoles: body.neededRoles,
      neededSkills: body.neededSkills,
      interestTags: body.interestTags,
    })
  } catch (_embeddingError) {
    // Embedding generation failed, continue without it
  }

  const { data, error } = await supabase.from('opportunities').insert({
      creator_id: user.id,
      type: body.type,
      title: body.title.trim(),
      description: body.description.trim(),
      needed_roles: body.neededRoles || [],
      needed_skills: body.neededSkills || [],
      interest_tags: body.interestTags || [],
      location_type: body.locationType || null,
      location: body.location || null,
      time_commitment: body.timeCommitment || null,
      compensation_type: body.compensationType || null,
      compensation_details: body.compensationDetails || null,
      vision_embedding: embedding ? JSON.stringify(embedding) : null,
    })
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError('Opportunity 생성에 실패했습니다')
  }

  await incrementOpportunityUsage(supabase, user.id)

  // Funnel Stage 3b: 프로젝트 생성 = 자기주도 기회 발행
  captureServerEvent('opportunity_created', {
    userId: user.id,
    opportunityId: data.id,
    type: data.type,
    has_embedding: !!embedding,
  }).catch(() => {})

  // 실시간 Discord 알림 — 신규 프로젝트/스터디 발행
  const kindLabel = data.type === 'startup' ? '창업' : data.type === 'study' ? '스터디' : '사이드 프로젝트'
  const rolesPreview = Array.isArray(body.neededRoles) && body.neededRoles.length > 0
    ? (body.neededRoles as string[]).slice(0, 3).join(' · ')
    : '미정'
  void postSignal('new_project', {
    title: `🚀 새 ${kindLabel} 등록`,
    description: `**${data.title}**`,
    fields: [
      { name: '모집 역할', value: rolesPreview, inline: true },
      { name: '유형', value: kindLabel, inline: true },
    ],
    footer: `opportunity: ${data.id.slice(0, 8)}`,
  })

  return ApiResponse.created(data)
})
