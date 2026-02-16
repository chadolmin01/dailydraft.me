import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      currentSituation,
      nickname,
      ageRange,
      university,
      major,
      graduationYear,
      location,
      skills,
      interestTags,
      desiredPosition,
      personality,
    } = body

    // Validate required fields
    if (!nickname || !location || !currentSituation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const profileData = {
      user_id: user.id,
      current_situation: currentSituation,
      nickname,
      age_range: ageRange || null,
      university: university || null,
      major: major || null,
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
      location,
      skills: skills || [],
      interest_tags: interestTags || [],
      desired_position: desiredPosition,
      personality: personality || { risk: 5, time: 5, communication: 5, decision: 5 },
      onboarding_completed: true,
    }

    let error
    if (existingProfile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase.from('profiles') as any)
        .update(profileData)
        .eq('user_id', user.id)
      error = result.error
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase.from('profiles') as any).insert(profileData)
      error = result.error
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save profile', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
