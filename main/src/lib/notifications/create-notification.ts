import { createClient } from '@/src/lib/supabase/server'

export type NotificationType =
  | 'deadline'
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'connection'
  | 'recommendation'
  | 'new_match'

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
    const supabase = await createClient()

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
    message: `"${opportunityTitle}"에 대한 지원이 수락되었습니다. 연결 페이지에서 연락처를 확인하세요.`,
    link: '/connections',
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
    link: '/connections',
  })
}
