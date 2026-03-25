import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface ConversationPartner {
  nickname: string
  desired_position: string | null
  avatar_url: string | null
}

export interface Conversation {
  partnerId: string
  lastMessage: string
  lastAt: string
  unreadCount: number
}

const messageKeys = {
  all: ['messages'] as const,
  conversations: () => [...messageKeys.all, 'conversations'] as const,
  thread: (partnerId: string) => [...messageKeys.all, 'thread', partnerId] as const,
  unread: () => [...messageKeys.all, 'unread'] as const,
}

// 대화 목록
export function useConversations() {
  return useQuery({
    queryKey: messageKeys.conversations(),
    queryFn: async () => {
      const res = await fetch('/api/messages/conversations')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      return res.json() as Promise<{
        conversations: Conversation[]
        profiles: Record<string, ConversationPartner>
      }>
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

// 특정 상대와의 메시지 스레드
export function useMessageThread(partnerId: string | null) {
  return useQuery({
    queryKey: messageKeys.thread(partnerId || ''),
    queryFn: async () => {
      const res = await fetch(`/api/messages?type=all&partner_id=${partnerId}&limit=50`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json() as {
        messages: DirectMessage[]
        profiles: Record<string, ConversationPartner>
        unread_count: number
      }
      // Messages already filtered server-side, just reverse for chronological order
      return { messages: data.messages.reverse(), profiles: data.profiles, unread_count: data.unread_count }
    },
    enabled: !!partnerId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}

// 쪽지 보내기
export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ receiver_id, content }: { receiver_id: string; content: string }) => {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id, content }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '쪽지 전송에 실패했습니다')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations() })
      qc.invalidateQueries({ queryKey: messageKeys.thread(variables.receiver_id) })
    },
  })
}

// 읽음 처리
export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}

// 삭제
export function useDeleteMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}

// 읽지 않은 쪽지 수
export function useUnreadCount() {
  return useQuery({
    queryKey: messageKeys.unread(),
    queryFn: async () => {
      const res = await fetch('/api/messages?type=received&limit=1')
      if (!res.ok) return 0
      const data = await res.json()
      return (data.unread_count as number) || 0
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
