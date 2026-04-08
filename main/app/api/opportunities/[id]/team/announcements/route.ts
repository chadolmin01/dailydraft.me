import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: Get all announcements for an opportunity
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

  const { data: announcements, error } = await supabase
    .from('team_announcements')
    .select(`
      *,
      profiles!team_announcements_author_id_fkey (
        nickname
      )
    `)
    .eq('opportunity_id', id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return ApiResponse.internalError()
  }

  const formattedAnnouncements = (announcements || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    is_pinned: a.is_pinned,
    created_at: a.created_at,
    updated_at: a.updated_at,
    author: a.profiles?.nickname || '알 수 없음',
    author_id: a.author_id,
  }))

  return ApiResponse.ok(formattedAnnouncements)
})

// POST: Create a new announcement
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
  const { title, content, is_pinned } = body

  if (!title || !content) {
    return ApiResponse.badRequest('Title and content are required')
  }

  const { data, error } = await supabase
    .from('team_announcements')
    .insert({
      opportunity_id: id,
      author_id: user.id,
      title,
      content,
      is_pinned: is_pinned || false,
    })
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError()
  }

  return ApiResponse.created(data)
})
