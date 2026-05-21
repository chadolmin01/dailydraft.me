import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'
import { testDiscordWebhook } from '@/src/lib/webhooks/discord'
import { testSlackWebhook } from '@/src/lib/webhooks/slack'

/** GET: 클럽의 알림 채널 목록 조회 */
export const GET = withErrorCapture(
  async (_request, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug: clubId } = await params
    if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { data, error } = await supabase
      .from('club_notification_channels')
      .select('id, channel_type, label, event_types, enabled, created_at')
      .eq('club_id', clubId)
      .order('created_at', { ascending: true })

    if (error) return ApiResponse.internalError('알림 채널 목록을 불러오지 못했습니다')

    return ApiResponse.ok(data)
  }
)

/** POST: 새 알림 채널 등록 (+ 테스트 메시지 발송) */
export const POST = withErrorCapture(
  async (request, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug: clubId } = await params
    if (!isValidUUID(clubId)) return ApiResponse.badRequest('유효하지 않은 클럽 ID입니다')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await parseJsonBody<{
      channel_type: string
      webhook_url: string
      label?: string
      event_types?: string[]
    }>(request)
    if (body instanceof Response) return body

    const { channel_type, webhook_url, label, event_types } = body

    // 유효성 검증
    if (!['discord_webhook', 'slack_webhook'].includes(channel_type)) {
      return ApiResponse.badRequest('지원하지 않는 채널 타입입니다')
    }

    if (!webhook_url?.trim()) {
      return ApiResponse.badRequest('웹훅 URL은 필수입니다')
    }

    // URL 형식 검증 — 각 채널 타입별
    if (
      channel_type === 'discord_webhook' &&
      !webhook_url.startsWith('https://discord.com/api/webhooks/')
    ) {
      return ApiResponse.badRequest(
        '올바른 Discord 웹훅 URL이 아닙니다. https://discord.com/api/webhooks/... 형식이어야 합니다'
      )
    }
    if (
      channel_type === 'slack_webhook' &&
      !webhook_url.startsWith('https://hooks.slack.com/')
    ) {
      return ApiResponse.badRequest(
        '올바른 Slack 웹훅 URL이 아닙니다. https://hooks.slack.com/... 형식이어야 합니다'
      )
    }

    // 테스트 메시지 발송
    if (channel_type === 'discord_webhook') {
      const testOk = await testDiscordWebhook(webhook_url)
      if (!testOk) {
        return ApiResponse.badRequest(
          '웹훅 URL로 테스트 메시지를 보내지 못했습니다. URL을 확인해주세요'
        )
      }
    }
    if (channel_type === 'slack_webhook') {
      const testOk = await testSlackWebhook(webhook_url)
      if (!testOk) {
        return ApiResponse.badRequest(
          'Slack 웹훅 URL로 테스트 메시지를 보내지 못했습니다. URL을 확인해주세요'
        )
      }
    }

    // DB 저장
    const { data, error } = await supabase
      .from('club_notification_channels')
      .insert({
        club_id: clubId,
        channel_type,
        webhook_url: webhook_url.trim(),
        label: label?.trim() || 'default',
        event_types: event_types ?? ['update_posted', 'update_remind', 'announcement'],
        enabled: true,
        created_by: user.id,
      })
      .select('id, channel_type, label, event_types, enabled, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return ApiResponse.badRequest('이미 등록된 웹훅 URL입니다')
      }
      return ApiResponse.internalError('알림 채널 등록에 실패했습니다')
    }

    return ApiResponse.created(data)
  }
)
