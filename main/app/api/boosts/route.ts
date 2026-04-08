import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse, validateRequired } from '@/src/lib/api-utils'
import { BOOST_PRODUCTS, type BoostType } from '@/src/lib/subscription/constants'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: Get active boosts for user or opportunity
export const GET = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const opportunityId = searchParams.get('opportunityId')
  const includeExpired = searchParams.get('includeExpired') === 'true'

  if (opportunityId) {
    let query = supabase
      .from('boosts')
      .select('*')
      .eq('opportunity_id', opportunityId)

    if (!includeExpired) {
      query = query.eq('status', 'active').gt('expires_at', new Date().toISOString())
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return ApiResponse.internalError('부스트 조회 중 오류가 발생했습니다', error.message)
    }

    return ApiResponse.ok(data || [])
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  let query = supabase.from('boosts').select('*, opportunities(id, title)').eq('user_id', user.id)

  if (!includeExpired) {
    query = query.eq('status', 'active').gt('expires_at', new Date().toISOString())
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return ApiResponse.internalError('부스트 조회 중 오류가 발생했습니다', error.message)
  }

  return ApiResponse.ok(data || [])
})

// POST: Create boost (requires premium status)
export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('user_id', user.id)
    .single()

  if (!profile?.is_premium) {
    return ApiResponse.forbidden('프리미엄 사용자만 부스트를 사용할 수 있습니다')
  }

  const body = await request.json()
  const validation = validateRequired(body, ['boostType'])

  if (!validation.valid) {
    return ApiResponse.badRequest(
      `필수 항목이 누락되었습니다: ${validation.missing.join(', ')}`
    )
  }

  const { boostType, opportunityId } = body

  if (!Object.keys(BOOST_PRODUCTS).includes(boostType)) {
    return ApiResponse.badRequest('유효하지 않은 부스트 타입입니다')
  }

  if (['opportunity_boost', 'opportunity_premium', 'weekly_feature'].includes(boostType)) {
    if (!opportunityId) {
      return ApiResponse.badRequest('Opportunity ID가 필요합니다')
    }

    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('creator_id, status')
      .eq('id', opportunityId)
      .single()

    if (!opportunity) {
      return ApiResponse.notFound('Opportunity를 찾을 수 없습니다')
    }

    if (opportunity.creator_id !== user.id) {
      return ApiResponse.forbidden('본인의 Opportunity만 부스트할 수 있습니다')
    }

    if (opportunity.status !== 'active') {
      return ApiResponse.badRequest('활성 상태의 Opportunity만 부스트할 수 있습니다')
    }

    const { data: existingBoost } = await supabase
      .from('boosts')
      .select('id')
      .eq('opportunity_id', opportunityId)
      .eq('boost_type', boostType)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingBoost) {
      return ApiResponse.badRequest('이미 활성화된 부스트가 있습니다')
    }
  }

  const boostProduct = BOOST_PRODUCTS[boostType as BoostType]

  const now = new Date()
  const expiresAt = new Date(now.getTime() + boostProduct.durationHours * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('boosts')
    .insert({
      user_id: user.id,
      opportunity_id: opportunityId || null,
      boost_type: boostType,
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_paid: 0,
      payment_id: null,
    })
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError('부스트 생성 중 오류가 발생했습니다', error.message)
  }

  return ApiResponse.created(data)
})

// DELETE: Cancel boost
export const DELETE = withErrorCapture(async (request) => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { searchParams } = new URL(request.url)
  const boostId = searchParams.get('id')

  if (!boostId) {
    return ApiResponse.badRequest('부스트 ID가 필요합니다')
  }

  const { data: boost } = await supabase
    .from('boosts')
    .select('*')
    .eq('id', boostId)
    .single()

  if (!boost) {
    return ApiResponse.notFound('부스트를 찾을 수 없습니다')
  }

  if (boost.user_id !== user.id) {
    return ApiResponse.forbidden('본인의 부스트만 취소할 수 있습니다')
  }

  if (boost.status !== 'active') {
    return ApiResponse.badRequest('활성 상태의 부스트만 취소할 수 있습니다')
  }

  const { error } = await supabase
    .from('boosts')
    .update({ status: 'canceled' })
    .eq('id', boostId)

  if (error) {
    return ApiResponse.internalError('부스트 취소 중 오류가 발생했습니다', error.message)
  }

  return ApiResponse.ok({ message: '부스트가 취소되었습니다' })
})
