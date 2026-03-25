import { createClient } from '@/src/lib/supabase/server'
import { NextRequest } from 'next/server'
import { ApiResponse } from '@/src/lib/api-utils'

// GET: 쪽지 목록 (받은/보낸/전체)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received' // received | sent | all
    const partnerId = searchParams.get('partner_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate partnerId as UUID to prevent PostgREST filter injection
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (partnerId && !UUID_RE.test(partnerId)) {
      return ApiResponse.badRequest('잘못된 사용자 ID입니다')
    }

    let query = supabase
      .from('direct_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (partnerId) {
      // Conversation mode: show all messages between current user and partner (ignores type filter)
      query = query.or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
    } else if (type === 'received') {
      query = query.eq('receiver_id', user.id).eq('deleted_by_receiver', false)
    } else if (type === 'sent') {
      query = query.eq('sender_id', user.id).eq('deleted_by_sender', false)
    } else {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    }

    const { data: messages, error } = await query
    if (error) throw error

    // 상대방 프로필 정보 가져오기
    const otherIds = [...new Set((messages || []).map(m =>
      m.sender_id === user.id ? m.receiver_id : m.sender_id
    ))]

    let profiles: Record<string, { nickname: string; desired_position: string | null; avatar_url: string | null }> = {}
    if (otherIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, nickname, desired_position, avatar_url')
        .in('user_id', otherIds)

      if (profileData) {
        profiles = Object.fromEntries(
          profileData.map(p => [p.user_id, { nickname: p.nickname, desired_position: p.desired_position, avatar_url: p.avatar_url }])
        )
      }
    }

    // 읽지 않은 수
    const { count: unreadCount } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .eq('deleted_by_receiver', false)

    return ApiResponse.ok({
      messages: messages || [],
      profiles,
      unread_count: unreadCount || 0,
    })
  } catch {
    return ApiResponse.internalError()
  }
}

// POST: 쪽지 보내기
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await request.json()
    const { receiver_id, content } = body as { receiver_id: string; content: string }

    if (!receiver_id || !content?.trim()) {
      return ApiResponse.badRequest('받는 사람과 내용을 입력해주세요')
    }

    if (receiver_id === user.id) {
      return ApiResponse.badRequest('자신에게 쪽지를 보낼 수 없습니다')
    }

    const trimmed = content.trim()
    if (trimmed.length > 2000) {
      return ApiResponse.badRequest('쪽지는 2000자까지 가능합니다')
    }

    // Rate limit: 같은 상대에게 1분 내 5개 제한
    const oneMinAgo = new Date(Date.now() - 60000).toISOString()
    const { count: recentCount } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', receiver_id)
      .gte('created_at', oneMinAgo)

    if ((recentCount || 0) >= 5) {
      return ApiResponse.rateLimited('잠시 후 다시 시도해주세요')
    }

    // 수신자 존재 확인
    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('user_id, nickname')
      .eq('user_id', receiver_id)
      .single()

    if (!receiverProfile) {
      return ApiResponse.notFound('존재하지 않는 사용자입니다')
    }

    // 쪽지 생성
    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        receiver_id,
        content: trimmed,
      })
      .select()
      .single()

    if (error) throw error

    // 알림 생성
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('user_id', user.id)
      .single()

    const senderName = (senderProfile as { nickname: string } | null)?.nickname || '누군가'

    await supabase.from('event_notifications').insert({
      user_id: receiver_id,
      notification_type: 'direct_message',
      title: `${senderName}님이 쪽지를 보냈습니다`,
      message: trimmed.length > 80 ? trimmed.slice(0, 80) + '...' : trimmed,
      link: '/messages',
      status: 'unread',
      metadata: { sender_id: user.id, message_id: message.id },
    })

    return ApiResponse.created({ message })
  } catch {
    return ApiResponse.internalError()
  }
}
