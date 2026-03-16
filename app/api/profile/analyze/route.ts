import { NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'
import { analyzeProfile } from '@/src/lib/ai/profile-analyzer'
import { logError } from '@/src/lib/error-logging'

// Rate limit: 하루 3회
const DAILY_LIMIT = 3
const analysisCounts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const record = analysisCounts.get(userId)

  if (!record || now > record.resetAt) {
    analysisCounts.set(userId, {
      count: 1,
      resetAt: now + 24 * 60 * 60 * 1000,
    })
    return true
  }

  if (record.count >= DAILY_LIMIT) {
    return false
  }

  record.count++
  return true
}

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    // Rate limit
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: '일일 분석 한도(3회)를 초과했습니다.' },
        { status: 429 }
      )
    }

    // 프로필 fetch
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 최소 데이터 검증
    const skills = profile.skills as Array<{ name: string; level: string }> | null
    const hasMinimumData =
      profile.desired_position &&
      (skills?.length || (profile.interest_tags as string[] | null)?.length)

    if (!hasMinimumData) {
      return NextResponse.json(
        { error: '분석을 위해 포지션과 스킬 또는 관심 태그가 필요합니다.' },
        { status: 400 }
      )
    }

    // AI 분석
    const analysis = await analyzeProfile({
      desired_position: profile.desired_position,
      skills: skills,
      interest_tags: profile.interest_tags as string[] | null,
      personality: profile.personality as Record<string, number> | null,
      vision_summary: profile.vision_summary,
      current_situation: profile.current_situation,
      major: profile.major,
      extracted_profile: (profile as Record<string, unknown>).extracted_profile as Record<string, unknown> | null,
    })

    // DB 저장
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_analysis: analysis as unknown as Record<string, unknown>,
        profile_analysis_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to save analysis:', updateError)
      return NextResponse.json(
        { error: '분석 결과 저장에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    await logError({
      level: 'error',
      source: 'api',
      errorCode: err.name,
      message: err.message,
      stackTrace: err.stack,
      endpoint: '/api/profile/analyze',
      method: 'POST',
    })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
