import { createClient } from '@/src/lib/supabase/server'
import { createAdminClient } from '@/src/lib/supabase/admin'
import { ApiResponse, isValidUUID, parseJsonBody } from '@/src/lib/api-utils'
import { notifyProjectUpdate } from '@/src/lib/notifications/create-notification'
import { sendClubUpdatePostedWebhook } from '@/src/lib/webhooks/send-club-webhook'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

export const POST = withErrorCapture(async (request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  const body = await parseJsonBody<{
    opportunity_id: string
    week_number: number
    title: string
    content: string
    update_type: string
  }>(request)
  if (body instanceof Response) return body

  const { opportunity_id, week_number, title, content, update_type } = body

  if (!opportunity_id || !isValidUUID(opportunity_id)) {
    return ApiResponse.badRequest('유효하지 않은 프로젝트 ID입니다')
  }
  if (!title?.trim() || !content?.trim()) {
    return ApiResponse.badRequest('제목과 내용은 필수입니다')
  }
  if (!['ideation', 'design', 'development', 'launch', 'general'].includes(update_type)) {
    return ApiResponse.badRequest('유효하지 않은 업데이트 유형입니다')
  }

  // 주차당 1회 제한: 이미 해당 주차에 업데이트가 있으면 거부
  // 왜: 주간 업데이트는 주차당 1개만 허용. 수정은 PATCH로.
  const { data: existing } = await supabase
    .from('project_updates')
    .select('id')
    .eq('opportunity_id', opportunity_id)
    .eq('week_number', week_number)
    .maybeSingle()

  if (existing) {
    return ApiResponse.conflict(
      `${week_number}주차 업데이트가 이미 존재합니다. 수정하려면 기존 업데이트를 편집해주세요.`
    )
  }

  // Insert the update
  const { data: update, error } = await supabase
    .from('project_updates')
    .insert({
      opportunity_id,
      author_id: user.id,
      week_number,
      title: title.trim(),
      content: content.trim(),
      update_type,
    })
    .select()
    .single()

  if (error) {
    return ApiResponse.internalError('업데이트 생성에 실패했습니다')
  }

  // Send notifications to team members (fire-and-forget, don't block response)
  sendTeamNotifications(opportunity_id, user.id, title.trim(), update_type, week_number).catch(() => {})

  return ApiResponse.created(update)
})

async function sendTeamNotifications(
  opportunityId: string,
  authorId: string,
  updateTitle: string,
  updateType: string,
  weekNumber: number
) {
  const admin = createAdminClient()

  // Fetch opportunity title and author name in parallel
  const [opportunityResult, authorResult, membersResult] = await Promise.all([
    admin
      .from('opportunities')
      .select('title')
      .eq('id', opportunityId)
      .single(),
    admin
      .from('profiles')
      .select('nickname')
      .eq('user_id', authorId)
      .single(),
    admin
      .from('accepted_connections')
      .select('applicant_id')
      .eq('opportunity_id', opportunityId)
      .eq('status', 'active'),
  ])

  const projectTitle = opportunityResult.data?.title ?? '프로젝트'
  const authorName = authorResult.data?.nickname ?? '팀원'
  const members = membersResult.data ?? []

  // Notify each team member except the author
  const notifications = members
    .filter((m) => m.applicant_id !== authorId)
    .map((m) =>
      notifyProjectUpdate(
        m.applicant_id,
        authorName,
        projectTitle,
        updateTitle,
        opportunityId
      )
    )

  // Also notify the project creator if they're not the author
  const { data: opportunity } = await admin
    .from('opportunities')
    .select('creator_id')
    .eq('id', opportunityId)
    .single()

  if (opportunity?.creator_id && opportunity.creator_id !== authorId) {
    const isAlreadyMember = members.some(
      (m) => m.applicant_id === opportunity.creator_id
    )
    if (!isAlreadyMember) {
      notifications.push(
        notifyProjectUpdate(
          opportunity.creator_id,
          authorName,
          projectTitle,
          updateTitle,
          opportunityId
        )
      )
    }
  }

  await Promise.allSettled(notifications)

  // Discord/Slack 웹훅 발송 (클럽 소속 프로젝트인 경우)
  sendClubUpdatePostedWebhook({
    opportunityId,
    authorName,
    projectTitle,
    updateTitle,
    updateType,
    weekNumber,
  }).catch(() => {})
}
