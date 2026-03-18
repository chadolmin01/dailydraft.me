import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { generateConversationSummary } from '@/src/lib/ai/chat-manager'
import { generateProfileEmbedding } from '@/src/lib/ai/embeddings'
import type { ChatMessage } from '@/src/types/profile'

interface OnboardingData {
  nickname?: string
  location?: string
  ageRange?: string
  university?: string
  skills?: Array<{ name: string; level: string }>
  interestTags?: string[]
  desiredPosition?: string
  personality?: {
    risk: number
    time: number
    communication: number
    decision: number
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { conversationHistory, onboardingData } = await request.json()

    if (!conversationHistory || conversationHistory.length === 0) {
      return NextResponse.json({ error: 'No conversation history' }, { status: 400 })
    }

    // Generate summary
    const summary = await generateConversationSummary(conversationHistory as ChatMessage[])

    // Use onboardingData if provided, otherwise fetch from existing profile
    let skills: Array<{ name: string; level: string }> | null
    let interestTags: string[]
    let desiredPosition: string

    if (onboardingData) {
      // Use data from integrated onboarding form
      skills = onboardingData.skills || []
      interestTags = onboardingData.interestTags || []
      desiredPosition = onboardingData.desiredPosition || ''
    } else {
      // Fallback: Get user's profile for embedding generation
      const { data: profileData } = await supabase
        .from('profiles')
        .select('skills, interest_tags, desired_position')
        .eq('user_id', user.id)
        .single()

      if (!profileData) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const profile = profileData as {
        skills: Array<{ name: string; level: string }> | null
        interest_tags: string[]
        desired_position: string
      }

      skills = profile.skills
      interestTags = profile.interest_tags
      desiredPosition = profile.desired_position
    }

    // Generate embedding
    const embedding = await generateProfileEmbedding({
      visionSummary: summary,
      skills: skills ?? undefined,
      interestTags,
      desiredPosition,
    })

    // Build update object
    const updateData: Record<string, unknown> = {
      vision_summary: summary,
      vision_embedding: embedding,
      ai_chat_completed: true,
      ai_chat_transcript: conversationHistory,
      onboarding_completed: true,
    }

    // Add onboarding form data if provided
    if (onboardingData) {
      const formData = onboardingData as OnboardingData
      if (formData.nickname) updateData.nickname = formData.nickname
      if (formData.location) updateData.location = formData.location
      if (formData.ageRange) updateData.age_range = formData.ageRange
      if (formData.university) updateData.university = formData.university
      if (formData.skills) updateData.skills = formData.skills
      if (formData.interestTags) updateData.interest_tags = formData.interestTags
      if (formData.desiredPosition) updateData.desired_position = formData.desiredPosition
      if (formData.personality) updateData.personality = formData.personality
    }

    // Update profile with summary, embedding, and onboarding data
    const { error: updateError } = await supabase.from('profiles')
      .update(updateData)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      summary,
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
