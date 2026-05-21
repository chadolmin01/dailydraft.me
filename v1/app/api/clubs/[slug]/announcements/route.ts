import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

/**
 * GET /api/clubs/[slug]/announcements — 공지 목록
 * POST /api/clubs/[slug]/announcements — 공지 작성 (admin/owner)
 */

export const GET = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // RLS가 멤버 체크를 처리함
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: announcements, error, count } = await (supabase as any)
      .from('club_announcements')
      .select('id, title, content, is_pinned, author_id, created_at, updated_at', { count: 'exact' })
      .eq('club_id', club.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) return ApiResponse.internalError(error.message)

    // 작성자 프로필 enrichment
    const authorIds = [...new Set((announcements || []).map((a: { author_id: string }) => a.author_id))] as string[]
    let authors: Record<string, { nickname: string; avatar_url: string | null }> = {}

    if (authorIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, nickname, avatar_url')
        .in('user_id', authorIds)

      authors = Object.fromEntries(
        (profileData || []).map(p => [p.user_id, p])
      )
    }

    const result = (announcements || []).map((a: { author_id: string; [key: string]: unknown }) => ({
      ...a,
      author: authors[a.author_id] || null,
    }))

    return ApiResponse.ok({ announcements: result, total: count ?? 0 })
  }
)

export const POST = withErrorCapture(
  async (request, context) => {
    const { slug } = await context.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data: club } = await supabase
      .from('clubs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!club) return ApiResponse.notFound('클럽을 찾을 수 없습니다')

    // admin 권한 확인
    const { data: membership } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle()

    if (!membership) {
      return ApiResponse.forbidden('관리자만 공지를 작성할 수 있습니다')
    }

    const body = await request.json()
    const { title, content, is_pinned, scheduled_at } = body

    if (!title?.trim() || !content?.trim()) {
      return ApiResponse.badRequest('제목과 내용은 필수입니다')
    }

    // 예약 시각 파싱 (미래 시점만 예약으로 처리)
    let scheduledAt: string | null = null
    if (scheduled_at && typeof scheduled_at === 'string') {
      const dt = new Date(scheduled_at)
      if (!isNaN(dt.getTime()) && dt.getTime() > Date.now()) {
        scheduledAt = dt.toISOString()
      }
    }
    const publishedAt = scheduledAt ? null : new Date().toISOString()

    // RLS가 admin 체크를 처리함
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: announcement, error } = await (supabase as any)
      .from('club_announcements')
      .insert({
        club_id: club.id,
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
        is_pinned: is_pinned === true,
        scheduled_at: scheduledAt,
        published_at: publishedAt,
      })
      .select()
      .single()

    if (error) return ApiResponse.internalError(error.message)

    // 즉시 발행일 때만 웹훅 전파. 예약 건은 크론이 처리.
    if (!scheduledAt) {
      deliverAnnouncementWebhooks(supabase, club.id, title.trim(), content.trim())
        .catch(e => console.warn('[announcement] Webhook delivery failed:', e))
    }

    return ApiResponse.created(announcement)
  }
)

/** 공지를 등록된 웹훅(Discord/Slack)으로 전달 */
async function deliverAnnouncementWebhooks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clubId: string,
  title: string,
  content: string
) {
  const { data: channels } = await supabase
    .from('club_notification_channels')
    .select('webhook_url, channel_type')
    .eq('club_id', clubId)
    .contains('event_types', ['announcement'])

  if (!channels?.length) return

  const promises = channels.map(async (ch) => {
    // Discord webhook 형식
    const payload = ch.channel_type === 'discord'
      ? {
          embeds: [{
            title: `📢 ${title}`,
            description: content.slice(0, 2000),
            color: 0x6366f1,
            footer: { text: 'Draft 공지' },
            timestamp: new Date().toISOString(),
          }],
        }
      : { text: `📢 *${title}*\n${content.slice(0, 2000)}` } // Slack

    await fetch(ch.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
  })

  // 하나 실패해도 나머지는 계속 전달
  await Promise.allSettled(promises)
}
