import { createClient } from '@/src/lib/supabase/server'
import { notifyProfileViewMilestone } from '@/src/lib/notifications/create-notification'
import { NextRequest, NextResponse } from 'next/server'

// IP 기반 중복 조회 방지 (메모리 캐시, 15분 TTL)
const recentViews = new Map<string, number>()
const VIEW_COOLDOWN_MS = 15 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of recentViews) {
    if (now - timestamp > VIEW_COOLDOWN_MS) recentViews.delete(key)
  }
}, 5 * 60 * 1000)

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// 프로필 조회수 증가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ip = getClientIP(request)
    const viewKey = `${ip}:profile:${id}`

    // 같은 IP에서 15분 내 중복 조회 무시
    const lastView = recentViews.get(viewKey)
    if (lastView && Date.now() - lastView < VIEW_COOLDOWN_MS) {
      return NextResponse.json({ success: true, deduplicated: true })
    }

    const supabase = await createClient()

    // 현재 조회수 가져와서 +1
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('profile_views, user_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const typedProfile = profile as { profile_views: number | null; user_id: string }
    const currentViews = typedProfile.profile_views || 0
    const newViews = currentViews + 1
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_views: newViews } as never)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    // 10단위 마일스톤 알림 (10, 20, 30, ...)
    if (newViews % 10 === 0) {
      notifyProfileViewMilestone(typedProfile.user_id, newViews).catch(() => {})
    }

    recentViews.set(viewKey, Date.now())
    return NextResponse.json({ success: true, profile_views: newViews })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 프로필 조회수 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('profile_views')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      profile_views: (profile as { profile_views: number | null }).profile_views || 0,
    })
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
