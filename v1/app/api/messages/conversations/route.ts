import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'
import { withErrorCapture } from '@/src/lib/posthog/with-error-capture'

// GET: 대화 상대 목록 (최근 메시지 기준 정렬)
export const GET = withErrorCapture(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ApiResponse.unauthorized()

  // [1] 대화 목록용: 최근 메시지 200건 — 마지막 메시지/시각 미리보기만 뽑는 용도.
  //     unread 집계는 여기서 하지 않는다 (limit 200 밖에 있는 오래된 unread가 누락되기 때문).
  const { data: messages, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, receiver_id, content, created_at')
    .or(`and(sender_id.eq.${user.id},deleted_by_sender.eq.false),and(receiver_id.eq.${user.id},deleted_by_receiver.eq.false)`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error

  // 대화 상대별 최신 메시지 그룹핑 (unreadCount는 아래에서 별도 쿼리로 채움)
  const conversationMap = new Map<string, {
    partnerId: string
    lastMessage: string
    lastAt: string
    unreadCount: number
  }>()

  for (const msg of messages || []) {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
    if (!conversationMap.has(partnerId)) {
      conversationMap.set(partnerId, {
        partnerId,
        lastMessage: msg.content.length > 60 ? msg.content.slice(0, 60) + '...' : msg.content,
        lastAt: msg.created_at ?? new Date().toISOString(),
        unreadCount: 0,
      })
    }
  }

  // [2] unread 집계: 내가 받은 안 읽은 쪽지 전체를 sender_id별로 카운트.
  //     limit과 무관하게 정확한 값을 얻기 위해 별도 쿼리로 분리.
  //     안 읽은 쪽지는 일반적으로 수십 건 이하라 limit 없이 훑어도 가볍다.
  // hard cap 2000: 스팸/봇/장기 미접속으로 unread가 비정상적으로 쌓인 경우
  // 메모리 스파이크와 응답 지연을 막기 위한 안전장치. 일반 유저는 닿을 일 없음.
  const { data: unreadRows, error: unreadError } = await supabase
    .from('direct_messages')
    .select('sender_id')
    .eq('receiver_id', user.id)
    .eq('is_read', false)
    .eq('deleted_by_receiver', false)
    .limit(2000)

  if (unreadError) throw unreadError

  for (const row of unreadRows || []) {
    const senderId = row.sender_id
    if (!conversationMap.has(senderId)) {
      // 최근 200건 밖이지만 unread가 있는 상대 — 목록에는 올리되 미리보기는 비움
      conversationMap.set(senderId, {
        partnerId: senderId,
        lastMessage: '',
        lastAt: new Date(0).toISOString(),
        unreadCount: 0,
      })
    }
    conversationMap.get(senderId)!.unreadCount++
  }

  // 최신순 재정렬 (unread-only 대화가 뒤로 가도록 lastAt 기준)
  const conversations = Array.from(conversationMap.values())
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))

  // 프로필 정보
  const partnerIds = conversations.map(c => c.partnerId)
  let profiles: Record<string, { nickname: string; desired_position: string | null; avatar_url: string | null }> = {}

  if (partnerIds.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, nickname, desired_position, avatar_url')
      .in('user_id', partnerIds)

    if (profileData) {
      profiles = Object.fromEntries(
        profileData.map(p => [p.user_id, { nickname: p.nickname, desired_position: p.desired_position, avatar_url: p.avatar_url }])
      )
    }
  }

  return ApiResponse.ok({ conversations, profiles })
})
