import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: Get all checklists for an opportunity
export const GET = withErrorCapture(async (
  _request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (!opportunity) {
    return ApiResponse.notFound('Opportunity not found')
  }

  const isCreator = opportunity.creator_id === user.id
  if (!isCreator) {
    const { data: membership } = await supabase.from('accepted_connections')
      .select('id')
      .eq('opportunity_id', id)
      .eq('applicant_id', user.id)
      .limit(1)
      .single()
    if (!membership) {
      return ApiResponse.forbidden()
    }
  }

  const { data: checklists, error } = await supabase
    .from('team_checklists')
    .select('*')
    .eq('opportunity_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return ApiResponse.internalError()
  }

  const completed = (checklists || []).filter((c: any) => c.is_completed).length
  const total = (checklists || []).length

  return ApiResponse.ok({
    checklists: checklists || [],
    progress: {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
  })
})

// POST: Create a new checklist item
export const POST = withErrorCapture(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return ApiResponse.unauthorized()
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('creator_id')
    .eq('id', id)
    .single()

  if (!opportunity || opportunity.creator_id !== user.id) {
    return ApiResponse.forbidden()
  }

  const body = await request.json()
  const { title, description } = body

  if (!title) {
    return ApiResponse.badRequest('Title is required')
  }

  const { data: maxOrder } = await supabase
    .from('team_checklists')
    .select('sort_order')
    .eq('opportunity_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = maxOrder ? maxOrder.sort_order + 1 : 0

  const { data, error } = await supabase
    .from('team_checklists')
    .insert({
      opportunity_id: id,
      title,
      description: description || null,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.created(data)
})
