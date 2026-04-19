/**
 * GET /api/clubs/[slug]/discord-status — 클럽 Discord 봇 설치 여부만 리턴.
 * 운영자 대시보드의 "Discord 연결 안내 배너" 표시 판단용.
 *
 * 왜 분리: 전체 bot-activity 는 payload 가 크고 권한 검사도 무거움.
 * 설치 여부만 필요한 경우 이 가벼운 엔드포인트를 사용.
 */

import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const GET = withErrorCapture(async (_request, context) => {
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

  const { data: membership } = await supabase
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .in('role', ['admin', 'owner'])
    .maybeSingle()

  if (!membership) return ApiResponse.forbidden('운영진만 조회 가능합니다')

  const admin = createAdminClient()
  const { data: inst } = await admin
    .from('discord_bot_installations')
    .select('discord_guild_id, discord_guild_name')
    .eq('club_id', club.id)
    .maybeSingle()

  return ApiResponse.ok({
    connected: !!inst,
    guild_name: inst?.discord_guild_name ?? null,
  })
})
