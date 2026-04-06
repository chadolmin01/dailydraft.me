import { createAdminClient } from '@/src/lib/supabase/admin'

export type NotificationType =
  | 'deadline'
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'connection'
  | 'recommendation'
  | 'new_match'
  | 'coffee_chat'
  | 'project_invitation'
  | 'comment'
  | 'profile_interest'
  | 'profile_milestone'
  | 'project_update'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: Record<string, string>
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  metadata,
}: CreateNotificationParams): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // 사용자의 알림 설정 확인
    const { data: settings } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 알림 설정에서 해당 유형이 비활성화되어 있으면 생성하지 않음
    if (settings) {
      const settingsData = settings as unknown as {
        deadline_reminders: boolean
        application_updates: boolean
        new_matches: boolean
      }

      if (type === 'deadline' && !settingsData.deadline_reminders) return false
      if (
        ['application_received', 'application_accepted', 'application_rejected'].includes(type) &&
        !settingsData.application_updates
      )
        return false
      if (['recommendation', 'new_match'].includes(type) && !settingsData.new_matches)
        return false
    }

    // 알림 생성 (event_notifications 테이블 사용)
    const { error } = await supabase.from('event_notifications').insert({
      user_id: userId,
      notification_type: type,
      title,
      message,
      status: 'unread',
      link: link || null,
      metadata: metadata || {},
    } as never)

    if (error) {
      return false
    }

    return true
  } catch (_error) {
    return false
  }
}

// 헬퍼 함수들
export async function notifyApplicationReceived(
  creatorId: string,
  applicantName: string,
  opportunityTitle: string,
  opportunityId: string
) {
  return createNotification({
    userId: creatorId,
    type: 'application_received',
    title: '새로운 지원서가 도착했습니다',
    message: `${applicantName}님이 "${opportunityTitle}"에 지원했습니다.`,
    link: '/applications?tab=received',
    metadata: {
      opportunity_id: opportunityId,
      opportunity_title: opportunityTitle,
      applicant_name: applicantName,
    },
  })
}

export async function notifyApplicationAccepted(
  applicantId: string,
  opportunityTitle: string,
  opportunityId: string
) {
  return createNotification({
    userId: applicantId,
    type: 'application_accepted',
    title: '지원이 수락되었습니다!',
    message: `"${opportunityTitle}"에 대한 지원이 수락되었습니다! 프로젝트를 확인하세요.`,
    link: `/opportunities/${opportunityId}`,
    metadata: {
      opportunity_id: opportunityId,
      opportunity_title: opportunityTitle,
    },
  })
}

export async function notifyApplicationRejected(
  applicantId: string,
  opportunityTitle: string,
  opportunityId: string
) {
  return createNotification({
    userId: applicantId,
    type: 'application_rejected',
    title: '지원 결과 안내',
    message: `"${opportunityTitle}"에 대한 지원이 거절되었습니다. 다른 기회를 찾아보세요.`,
    link: '/opportunities',
    metadata: {
      opportunity_id: opportunityId,
      opportunity_title: opportunityTitle,
    },
  })
}

export async function notifyNewConnection(
  userId: string,
  partnerName: string,
  opportunityTitle: string
) {
  return createNotification({
    userId,
    type: 'connection',
    title: '새로운 연결이 생겼습니다!',
    message: `${partnerName}님과 "${opportunityTitle}"를 통해 연결되었습니다.`,
    link: '/profile?tab=coffee-chats',
  })
}

export async function notifyCoffeeChatRequest(
  ownerId: string,
  requesterName: string,
  projectTitle: string
) {
  return createNotification({
    userId: ownerId,
    type: 'coffee_chat',
    title: '커피챗 요청이 도착했습니다',
    message: `${requesterName}님이 "${projectTitle}" 관련 커피챗을 요청했습니다.`,
    link: '/profile?tab=coffee-chats',
  })
}

export async function notifyCoffeeChatResponse(
  requesterId: string,
  ownerName: string,
  projectTitle: string,
  accepted: boolean
) {
  return createNotification({
    userId: requesterId,
    type: 'coffee_chat',
    title: accepted ? '커피챗이 수락되었습니다!' : '커피챗 결과 안내',
    message: accepted
      ? `${ownerName}님이 "${projectTitle}" 커피챗을 수락했습니다. 연락처를 확인하세요.`
      : `${ownerName}님이 "${projectTitle}" 커피챗을 거절했습니다.`,
    link: '/profile?tab=coffee-chats',
  })
}

export async function notifyPersonCoffeeChatRequest(
  targetUserId: string,
  requesterName: string
) {
  return createNotification({
    userId: targetUserId,
    type: 'coffee_chat',
    title: '개인 커피챗 요청이 도착했습니다',
    message: `${requesterName}님이 커피챗을 요청했습니다.`,
    link: '/profile?tab=coffee-chats',
  })
}

export async function notifyPersonCoffeeChatResponse(
  requesterId: string,
  targetName: string,
  accepted: boolean
) {
  return createNotification({
    userId: requesterId,
    type: 'coffee_chat',
    title: accepted ? '커피챗이 수락되었습니다!' : '커피챗 결과 안내',
    message: accepted
      ? `${targetName}님이 커피챗을 수락했습니다. 연락처를 확인하세요.`
      : `${targetName}님이 커피챗을 거절했습니다.`,
    link: '/profile?tab=coffee-chats',
  })
}

export async function notifyInterviewScheduled(
  applicantId: string,
  creatorName: string,
  opportunityTitle: string,
  opportunityId: string
) {
  return createNotification({
    userId: applicantId,
    type: 'coffee_chat',
    title: '프로젝트 리더가 면담을 원합니다',
    message: `${creatorName}님이 '${opportunityTitle}' 프로젝트에 대해 이야기를 나누고 싶어합니다.`,
    link: '/profile?tab=coffee-chats',
    metadata: {
      opportunity_id: opportunityId,
      opportunity_title: opportunityTitle,
    },
  })
}

export async function notifyProjectInvitation(
  invitedUserId: string,
  inviterName: string,
  projectTitle: string,
  role: string
) {
  return createNotification({
    userId: invitedUserId,
    type: 'project_invitation',
    title: '프로젝트 초대가 도착했습니다',
    message: `${inviterName}님이 "${projectTitle}" 프로젝트에 ${role} 역할로 초대했습니다.`,
    link: '/profile?tab=invitations',
  })
}

export async function notifyInvitationResponse(
  inviterId: string,
  invitedName: string,
  projectTitle: string,
  accepted: boolean
) {
  return createNotification({
    userId: inviterId,
    type: 'project_invitation',
    title: accepted ? '프로젝트 초대가 수락되었습니다!' : '프로젝트 초대 결과 안내',
    message: accepted
      ? `${invitedName}님이 "${projectTitle}" 초대를 수락했습니다.`
      : `${invitedName}님이 "${projectTitle}" 초대를 거절했습니다.`,
    link: '/profile?tab=invitations',
  })
}

export async function notifyNewComment(
  creatorId: string,
  commenterName: string,
  opportunityTitle: string,
  opportunityId: string
) {
  return createNotification({
    userId: creatorId,
    type: 'comment',
    title: '새 댓글이 달렸습니다',
    message: `${commenterName}님이 "${opportunityTitle}"에 댓글을 남겼습니다.`,
    link: `/opportunities/${opportunityId}`,
    metadata: {
      opportunity_id: opportunityId,
    },
  })
}

export async function notifyProfileInterest(
  targetUserId: string,
  likerName: string
) {
  return createNotification({
    userId: targetUserId,
    type: 'profile_interest',
    title: '누군가 관심을 표현했습니다',
    message: `${likerName}님이 회원님의 프로필에 관심을 표현했습니다.`,
    link: '/profile',
  })
}

export async function notifyProjectUpdate(
  memberId: string,
  authorName: string,
  projectTitle: string,
  updateTitle: string,
  opportunityId: string
) {
  return createNotification({
    userId: memberId,
    type: 'project_update',
    title: '프로젝트 주간 업데이트',
    message: `${authorName}님이 "${projectTitle}"에 새 업데이트를 올렸습니다: ${updateTitle}`,
    link: `/p/${opportunityId}`,
    metadata: {
      opportunity_id: opportunityId,
      update_title: updateTitle,
    },
  })
}

export async function notifyProfileViewMilestone(
  userId: string,
  views: number
) {
  return createNotification({
    userId,
    type: 'profile_milestone',
    title: `프로필 조회수 ${views}회 돌파!`,
    message: `회원님의 프로필이 ${views}회 조회되었습니다. 관심이 높아지고 있어요!`,
    link: '/profile',
  })
}

/** 팀원 추방 시 추방당한 멤버에게 알림 */
export async function notifyTeamKicked(
  memberId: string,
  projectTitle: string,
  projectId: string
) {
  return createNotification({
    userId: memberId,
    type: 'connection',
    title: '팀에서 제외되었습니다',
    message: `"${projectTitle}" 프로젝트에서 제외되었습니다.`,
    link: `/explore`,
  })
}

/** 팀원 자진 탈퇴 시 생성자에게 알림 */
export async function notifyTeamLeft(
  creatorId: string,
  memberName: string,
  projectTitle: string,
  projectId: string
) {
  return createNotification({
    userId: creatorId,
    type: 'connection',
    title: '팀원이 탈퇴했습니다',
    message: `${memberName}님이 "${projectTitle}" 프로젝트에서 탈퇴했습니다.`,
    link: `/projects/${projectId}/edit?tab=team`,
  })
}
