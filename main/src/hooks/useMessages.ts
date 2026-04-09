import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'

export interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  // 클라이언트 전용: optimistic 상태 추적. 서버 응답엔 포함되지 않음.
  // sending = 전송 중(반투명 + 시계), failed = 실패(재전송 버튼 노출).
  _status?: 'sending' | 'failed'
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
  const { user, isLoading: isAuthLoading } = useAuth()
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
    enabled: !isAuthLoading && !!user,
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

// 쪽지 보내기 (optimistic update)
export function useSendMessage() {
  const qc = useQueryClient()
  const { user } = useAuth()

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
    onMutate: async (variables) => {
      await qc.cancelQueries({ queryKey: messageKeys.thread(variables.receiver_id) })
      const previousThread = qc.getQueryData(messageKeys.thread(variables.receiver_id))

      // Optimistic insert. 실패 시 롤백하지 않고 _status='failed'로 바꿔
      // 사용자가 재전송 버튼을 누를 수 있게 남겨둔다 (롤백하면 메시지가 사라져서 혼란).
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      if (user) {
        qc.setQueryData(messageKeys.thread(variables.receiver_id), (old: any) => {
          if (!old) return old
          const optimisticMsg: DirectMessage = {
            id: tempId,
            sender_id: user.id,
            receiver_id: variables.receiver_id,
            content: variables.content,
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString(),
            _status: 'sending',
          }
          return { ...old, messages: [...old.messages, optimisticMsg] }
        })
      }

      return { previousThread, tempId }
    },
    onError: (_err, variables, context) => {
      // 실패 메시지는 남겨두되 status만 failed로 전환 (재전송 UX)
      if (context?.tempId) {
        qc.setQueryData(messageKeys.thread(variables.receiver_id), (old: any) => {
          if (!old) return old
          return {
            ...old,
            messages: old.messages.map((m: DirectMessage) =>
              m.id === context.tempId ? { ...m, _status: 'failed' as const } : m
            ),
          }
        })
      }
    },
    onSuccess: (_data, variables, context) => {
      // 성공 시 optimistic 메시지의 _status 제거 (Realtime/refetch가 곧 실제 값으로 교체)
      if (context?.tempId) {
        qc.setQueryData(messageKeys.thread(variables.receiver_id), (old: any) => {
          if (!old) return old
          return {
            ...old,
            messages: old.messages.map((m: DirectMessage) =>
              m.id === context.tempId ? { ...m, _status: undefined } : m
            ),
          }
        })
      }
      qc.invalidateQueries({ queryKey: messageKeys.conversations() })
      qc.invalidateQueries({ queryKey: messageKeys.thread(variables.receiver_id) })
    },
  })
}

// Realtime: direct_messages 테이블의 INSERT/UPDATE 구독
// 새 메시지 도착 또는 읽음 상태 변경 시 관련 React Query 캐시 invalidate.
// polling(15s/60s)을 대체하진 않고 보강한다 — Realtime이 끊겼을 때 polling이 fallback.
export function useMessagesRealtime() {
  const qc = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`dm-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as DirectMessage
          qc.invalidateQueries({ queryKey: messageKeys.conversations() })
          qc.invalidateQueries({ queryKey: messageKeys.thread(msg.sender_id) })
          qc.invalidateQueries({ queryKey: messageKeys.unread() })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          // 상대가 내 메시지를 읽었을 때 (is_read가 true로 변경)
          const msg = payload.new as DirectMessage
          qc.invalidateQueries({ queryKey: messageKeys.thread(msg.receiver_id) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, qc])
}

// Typing indicator via Supabase Presence
// 페어 단위 채널(정렬된 ID 쌍)을 공유해 양쪽이 같은 presence state를 본다.
export function useTypingIndicator(partnerId: string | null) {
  const { user } = useAuth()
  const [partnerTyping, setPartnerTyping] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user || !partnerId) {
      setPartnerTyping(false)
      return
    }

    // 페어 식별자는 양쪽 ID를 정렬해 동일 채널 이름 보장
    const pair = [user.id, partnerId].sort().join('_')
    const channel = supabase.channel(`typing:${pair}`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, Array<{ typing?: boolean }>>
        const partnerState = state[partnerId]
        setPartnerTyping(!!partnerState?.[0]?.typing)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false })
        }
      })

    channelRef.current = channel

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
      setPartnerTyping(false)
    }
  }, [user, partnerId])

  // 내가 타이핑 중임을 broadcast. 2초 후 자동 해제.
  const notifyTyping = () => {
    const channel = channelRef.current
    if (!channel) return
    channel.track({ typing: true })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ typing: false })
    }, 2000)
  }

  return { partnerTyping, notifyTyping }
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
  const { user, isLoading: isAuthLoading } = useAuth()
  return useQuery({
    queryKey: messageKeys.unread(),
    queryFn: async () => {
      const res = await fetch('/api/messages?type=received&limit=1')
      if (!res.ok) return 0
      const data = await res.json()
      return (data.unread_count as number) || 0
    },
    enabled: !isAuthLoading && !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}
