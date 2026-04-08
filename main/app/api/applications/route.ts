import { createClient } from '@/src/lib/supabase/server'
import { calculateMatchScore } from '@/src/lib/ai/opportunity-matcher'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import { notifyApplicationReceived } from '@/src/lib/notifications/create-notification'
import {
  checkApplicationLimit,
  incrementApplicationUsage,
} from '@/src/lib/subscription/usage-checker'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { Profile } from '@/src/types/profile'
import type { Opportunity } from '@/src/types/opportunity'

interface ApplicationWithOpportunity {
  id: string
  applicant_id: string
  opportunity_id: string
  status: string
  created_at: string
  opportunities: {
    id: string
    title: string
    type: string
    creator_id: string
  } | null
}

interface ApplicantProfile {
  user_id: string
  nickname: string | null
  skills: Array<{ name: string; level: string }> | null
  interest_tags: string[] | null
  desired_position: string | null
}

// POST: Create application
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const body = await request.json()
  const validation = validateRequired(body, ['opportunityId'])

  if (!validation.valid) {
    return ApiResponse.badRequest(`필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`)
  }

  const { opportunityId } = body

  const limitCheck = await checkApplicationLimit(supabase, user.id)
  if (!limitCheck.allowed) {
    return ApiResponse.forbidden(limitCheck.message || '이번 달 지원 횟수를 모두 사용했습니다')
  }

  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .eq('applicant_id', user.id)
    .maybeSingle()

  if (existing) {
    return ApiResponse.badRequest('이미 지원한 Opportunity입니다')
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profileData) {
    return ApiResponse.notFound('프로필을 찾을 수 없습니다')
  }

  const { data: opportunityData, error: oppError } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single()

  if (oppError || !opportunityData) {
    return ApiResponse.notFound('Opportunity를 찾을 수 없습니다')
  }

  const profile = profileData as unknown as Profile
  const opportunity = opportunityData as unknown as Opportunity

  if (opportunity.creator_id === user.id) {
    return ApiResponse.badRequest('본인이 만든 Opportunity에는 지원할 수 없습니다')
  }

  if (opportunity.status !== 'active') {
    return ApiResponse.badRequest('이 Opportunity는 더 이상 지원을 받지 않습니다')
  }

  const match = calculateMatchScore(profile, opportunity)

  const { data, error } = await supabase.from('applications')
    .insert({
      opportunity_id: opportunityId,
      applicant_id: user.id,
      intro: profile.vision_summary || `안녕하세요, ${profile.nickname}입니다.`,
      why_apply: '프로필을 확인해주세요!',
      portfolio_links: [],
      match_score: match.score,
      match_reason: match.reason,
    })
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError('지원서 생성에 실패했습니다', error.message)
  }

  await supabase.from('opportunities')
    .update({
      applications_count: (opportunity.applications_count || 0) + 1,
    })
    .eq('id', opportunityId)

  await incrementApplicationUsage(supabase, user.id)

  await notifyApplicationReceived(
    opportunity.creator_id,
    profile.nickname || '지원자',
    opportunity.title,
    opportunityId
  )

  return ApiResponse.created(data)
})

// GET: Get applications (sent or received)
export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const opportunityId = searchParams.get('opportunityId')

  if (type && !['sent', 'received'].includes(type)) {
    return ApiResponse.badRequest('type은 "sent" 또는 "received"만 가능합니다')
  }

  let query = supabase.from('applications').select(`
    *,
    opportunities (
      id,
      title,
      type,
      creator_id
    )
  `)

  if (type === 'sent') {
    query = query.eq('applicant_id', user.id)
  } else if (type === 'received') {
    const { data: myOpportunitiesData } = await supabase
      .from('opportunities')
      .select('id')
      .eq('creator_id', user.id)

    const myOpportunities = myOpportunitiesData as { id: string }[] | null

    if (!myOpportunities || myOpportunities.length === 0) {
      return ApiResponse.ok([])
    }

    const opportunityIds = myOpportunities.map((o) => o.id)
    query = query.in('opportunity_id', opportunityIds)
  }

  if (opportunityId) {
    query = query.eq('opportunity_id', opportunityId)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return ApiResponse.internalError('지원서 목록을 가져오는데 실패했습니다', error.message)
  }

  if (type === 'received' && data && data.length > 0) {
    const applications = data as ApplicationWithOpportunity[]
    const applicantIds = [...new Set(applications.map((app) => app.applicant_id))]

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nickname, skills, interest_tags, desired_position')
      .in('user_id', applicantIds)

    const profileMap = new Map(
      (profiles as ApplicantProfile[] || []).map((p) => [p.user_id, p])
    )

    const enrichedData = applications.map((app) => ({
      ...app,
      profiles: profileMap.get(app.applicant_id) || null,
    }))

    return ApiResponse.ok(enrichedData)
  }

  return ApiResponse.ok(data || [])
})
