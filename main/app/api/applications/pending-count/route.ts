import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

// GET: Get count of pending applications for user's opportunities
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Get user's opportunities
    const { data: myOpportunitiesData } = await supabase
      .from('opportunities')
      .select('id')
      .eq('creator_id', user.id)

    const myOpportunities = myOpportunitiesData as { id: string }[] | null

    if (!myOpportunities || myOpportunities.length === 0) {
      return NextResponse.json({ count: 0 })
    }

    const opportunityIds = myOpportunities.map((o) => o.id)

    // Count pending applications for these opportunities
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('opportunity_id', opportunityIds)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
