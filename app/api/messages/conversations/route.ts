import { createClient } from '@/src/lib/supabase/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET: 대화 상대 목록 (최근 메시지 기준 정렬)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    // 내가 보내거나 받은 모든 메시지 (삭제되지 않은 것만)
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('id, sender_id, receiver_id, content, is_read, created_at')
      .or(`and(sender_id.eq.${user.id},deleted_by_sender.eq.false),and(receiver_id.eq.${user.id},deleted_by_receiver.eq.false)`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    // 대화 상대별 최신 메시지 그룹핑
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
          lastAt: msg.created_at,
          unreadCount: 0,
        })
      }
      // 내가 받은 + 안 읽은 메시지 카운트
      if (msg.receiver_id === user.id && !msg.is_read) {
        const conv = conversationMap.get(partnerId)!
        conv.unreadCount++
      }
    }

    const conversations = Array.from(conversationMap.values())

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
  } catch {
    return ApiResponse.internalError()
  }
}
