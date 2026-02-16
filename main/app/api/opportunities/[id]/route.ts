import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

interface OpportunityData {
  id: string
  creator_id: string
  views_count: number
  [key: string]: unknown
}

// GET: Get opportunity by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get current user (may be null if not logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Fetch opportunity with creator profile
    const { data: oppData, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    const data = oppData as OpportunityData

    // Fetch creator profile separately
    const { data: creatorProfile } = await supabase
      .from('profiles')
      .select('nickname, desired_position, skills, interest_tags')
      .eq('user_id', data.creator_id)
      .single()

    // Check if current user has already applied
    let userApplication = null
    let isOwner = false

    if (user) {
      isOwner = data.creator_id === user.id

      // Check existing application
      const { data: application } = await supabase
        .from('applications')
        .select('id, status, created_at')
        .eq('opportunity_id', id)
        .eq('applicant_id', user.id)
        .single()

      userApplication = application
    }

    // Increment views count (only if not owner)
    if (!isOwner) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('opportunities') as any)
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id)
    }

    return NextResponse.json({
      ...data,
      creator: creatorProfile,
      userApplication,
      isOwner,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH: Update opportunity
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the creator
    const { data: opportunityData } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()

    const opportunity = opportunityData as { creator_id: string } | null

    if (!opportunity || opportunity.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Whitelist allowed fields to prevent mass assignment attacks
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
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('opportunities') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete opportunity
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is the creator
    const { data: oppData } = await supabase
      .from('opportunities')
      .select('creator_id')
      .eq('id', id)
      .single()

    const opportunity = oppData as { creator_id: string } | null

    if (!opportunity || opportunity.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('opportunities') as any).delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
