import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import type { Opportunity } from '@/src/types/opportunity'

// GET: Get opportunity by ID
export const GET = withErrorCapture(async (_request, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // opportunity + userApplication 은 서로 독립 → 병렬.
  // creatorProfile 은 opportunity.creator_id 필요해 직렬 유지.
  const [oppResult, applicationResult] = await Promise.all([
    supabase.from('opportunities').select('*').eq('id', id).single(),
    user
      ? supabase
          .from('applications')
          .select('id, status, created_at')
          .eq('opportunity_id', id)
          .eq('applicant_id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  if (oppResult.error) {
    return ApiResponse.notFound('Opportunity not found')
  }

  const data = oppResult.data as Opportunity
  const userApplication = applicationResult.data
  const isOwner = !!user && data.creator_id === user.id

  const { data: creatorProfile } = await supabase
    .from('profiles')
    .select('nickname, desired_position, skills, interest_tags')
    .eq('user_id', data.creator_id)
    .single()

  return ApiResponse.ok({
    ...data,
    creator: creatorProfile,
    userApplication,
    isOwner,
  })
})

// PATCH: Update opportunity
export const PATCH = withErrorCapture(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: opportunityData } = await supabase
    .from('opportunities')
    .select('creator_id')
    .eq('id', id)
    .single()

  const opportunity = opportunityData as { creator_id: string } | null

  if (!opportunity || opportunity.creator_id !== user.id) {
    return ApiResponse.forbidden()
  }

  const body = await request.json()

  const allowedFields = [
    'title',
    'description',
    'type',
    'needed_roles',
    'needed_skills',
    'interest_tags',
    'location_type',
    'location',
    'time_commitment',
    'compensation_type',
    'compensation_details',
    'project_links',
    'status',
    'deadline',
    'team_size',
    'project_stage',
  ]

  const updateData: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      updateData[key] = body[key]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return ApiResponse.badRequest('No valid fields to update')
  }

  const { data, error } = await supabase.from('opportunities')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok(data)
})

// DELETE: Delete opportunity
export const DELETE = withErrorCapture(async (_request, { params }: { params: Promise<{ id: string }> }) => {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: oppData } = await supabase
    .from('opportunities')
    .select('creator_id')
    .eq('id', id)
    .single()

  const opportunity = oppData as { creator_id: string } | null

  if (!opportunity || opportunity.creator_id !== user.id) {
    return ApiResponse.forbidden()
  }

  const { error } = await supabase.from('opportunities').delete().eq('id', id)

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.ok({ success: true })
})
