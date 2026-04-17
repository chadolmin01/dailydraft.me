import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import MessagesPageClient from '@/components/messages/MessagesPageClient'

// 유저별 대화목록이라 ISR 불가
export const dynamic = 'force-dynamic'

// useConversations() 의 queryKey와 정확히 일치해야 hydrate 적중
// messageKeys.conversations() = ['messages', 'conversations']
const CONVERSATIONS_KEY = ['messages', 'conversations'] as const

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/messages')

  const queryClient = new QueryClient()

  // 대화목록 prefetch — API route와 동일한 쿼리
  await queryClient.prefetchQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      // 최근 메시지 200건에서 상대별 최신 1건만 추출 (unread는 별도 집계)
      const { data: messages } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, created_at')
        .or(`and(sender_id.eq.${user.id},deleted_by_sender.eq.false),and(receiver_id.eq.${user.id},deleted_by_receiver.eq.false)`)
        .order('created_at', { ascending: false })
        .limit(200)

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

      // unread 집계 (limit과 무관하게 정확한 값)
      const { data: unreadRows } = await supabase
        .from('direct_messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .eq('deleted_by_receiver', false)
        .limit(2000)

      for (const row of unreadRows || []) {
        const partner = conversationMap.get(row.sender_id)
        if (partner) partner.unreadCount++
      }

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())

      // 상대방 프로필 batch fetch
      const partnerIds = conversations.map(c => c.partnerId)
      const profilesMap: Record<string, { nickname: string; desired_position: string | null; avatar_url: string | null }> = {}
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nickname, desired_position, avatar_url')
          .in('user_id', partnerIds)
        for (const p of profiles || []) {
          profilesMap[p.user_id] = {
            nickname: p.nickname ?? '익명',
            desired_position: p.desired_position,
            avatar_url: p.avatar_url,
          }
        }
      }

      return { conversations, profiles: profilesMap }
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MessagesPageClient />
    </HydrationBoundary>
  )
}
