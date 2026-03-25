'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/src/lib/supabase/client'

export type CoffeeChatOutcome = 'team_formed' | 'pending' | 'no_match'

export interface CoffeeChat {
  id: string
  opportunity_id: string | null
  target_user_id: string | null
  requester_email: string
  requester_user_id: string | null
  requester_name: string | null
  owner_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  contact_info: string | null
  message: string | null
  outcome: CoffeeChatOutcome | null
  created_at: string
  updated_at: string
}

export const coffeeChatKeys = {
  all: ['coffee_chats'] as const,
  owner: () => [...coffeeChatKeys.all, 'owner'] as const,
  requester: () => [...coffeeChatKeys.all, 'requester'] as const,
  byOpportunity: (id: string) => [...coffeeChatKeys.all, 'opportunity', id] as const,
  byTargetUser: (userId: string) => [...coffeeChatKeys.all, 'target_user', userId] as const,
}

interface UseCoffeeChatsOptions {
  opportunityId?: string
  targetUserId?: string
  asOwner?: boolean
  enabled?: boolean
}

// ── Query: fetch coffee chats ──
export function useCoffeeChats(options: UseCoffeeChatsOptions = {}) {
  const { opportunityId, targetUserId, asOwner = false, enabled = true } = options

  return useQuery({
    queryKey: targetUserId
      ? coffeeChatKeys.byTargetUser(targetUserId)
      : opportunityId
        ? coffeeChatKeys.byOpportunity(opportunityId)
        : asOwner
          ? coffeeChatKeys.owner()
          : coffeeChatKeys.requester(),
    queryFn: async () => {
      const { data: userData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!userData?.user) return []

      let query = supabase.from('coffee_chats').select('*')

      if (targetUserId) {
        // Person mode: 내가 이 사람에게 보낸 커피챗 조회
        query = query
          .eq('target_user_id', targetUserId)
          .eq('requester_user_id', userData.user.id)
      } else if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId)
      } else if (asOwner) {
        query = query.eq('owner_user_id', userData.user.id)
      } else {
        query = query.eq('requester_user_id', userData.user.id)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      return (data as CoffeeChat[]) || []
    },
    staleTime: 1000 * 60 * 2,
    enabled,
  })
}

// ── Mutation: request a coffee chat ──
export function useRequestCoffeeChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      opportunityId: string
      email: string
      name: string
      message?: string
    }) => {
      const { data: userData } = await supabase.auth.getUser()

      // Duplicate check
      if (userData?.user) {
        const { data: existing } = await supabase
          .from('coffee_chats')
          .select('id')
          .eq('opportunity_id', data.opportunityId)
          .eq('requester_user_id', userData.user.id)
          .eq('status', 'pending')
          .maybeSingle()

        if (existing) {
          throw new Error('이미 커피챗을 신청한 프로젝트입니다')
        }
      }

      const { data: result, error } = await supabase.rpc('request_coffee_chat', {
        p_opportunity_id: data.opportunityId,
        p_requester_email: data.email,
        p_requester_name: data.name,
        p_message: data.message || undefined,
        p_requester_user_id: userData?.user?.id || undefined,
      })

      if (error) throw error
      return result as string
    },
    onSuccess: (chatId) => {
      if (chatId) {
        fetch('/api/coffee-chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'request', chatId }),
        }).catch((err) => console.warn('[CoffeeChat] 알림 이메일 전송 실패 (커피챗은 정상 처리됨):', err))
      }
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}

// ── Mutation: accept a coffee chat ──
export function useAcceptCoffeeChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, contactInfo }: { chatId: string; contactInfo: string }) => {
      const { data, error } = await supabase.rpc('accept_coffee_chat', {
        p_chat_id: chatId,
        p_contact_info: contactInfo,
      })

      if (error) throw error
      if (!data) throw new Error('수락에 실패했습니다')
      return data as boolean
    },
    onSuccess: (_, variables) => {
      fetch('/api/coffee-chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'accepted', chatId: variables.chatId }),
      }).catch((err) => console.warn('[CoffeeChat] 알림 이메일 전송 실패 (커피챗은 정상 처리됨):', err))
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}

// ── Mutation: update coffee chat outcome ──
export function useUpdateChatOutcome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chatId, outcome }: { chatId: string; outcome: CoffeeChatOutcome }) => {
      const { error } = await (supabase as any)
        .from('coffee_chats')
        .update({ outcome })
        .eq('id', chatId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}

// ── Mutation: decline a coffee chat ──
export function useDeclineCoffeeChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chatId: string) => {
      const { data, error } = await supabase.rpc('decline_coffee_chat', {
        p_chat_id: chatId,
      })

      if (error) throw error
      if (!data) throw new Error('거절에 실패했습니다')
      return data as boolean
    },
    onSuccess: (_, chatId) => {
      fetch('/api/coffee-chat/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'declined', chatId }),
      }).catch((err) => console.warn('[CoffeeChat] 알림 이메일 전송 실패 (커피챗은 정상 처리됨):', err))
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}

// ── Mutation: request a person-to-person coffee chat ──
export function useRequestPersonCoffeeChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      targetUserId: string
      email: string
      name: string
      message?: string
    }) => {
      const { data: userData } = await supabase.auth.getUser()

      // Duplicate check
      if (userData?.user) {
        const { data: existing } = await supabase
          .from('coffee_chats')
          .select('id')
          .eq('target_user_id', data.targetUserId)
          .eq('requester_user_id', userData.user.id)
          .eq('status', 'pending')
          .maybeSingle()

        if (existing) {
          throw new Error('이미 이 사람에게 커피챗을 신청했습니다')
        }
      }

      const { data: result, error } = await supabase.rpc('request_person_coffee_chat', {
        p_target_user_id: data.targetUserId,
        p_requester_email: data.email,
        p_requester_name: data.name,
        p_message: data.message || undefined,
        p_requester_user_id: userData?.user?.id || undefined,
      })

      if (error) throw error
      return result as string
    },
    onSuccess: (chatId) => {
      if (chatId) {
        fetch('/api/coffee-chat/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'request', chatId }),
        }).catch((err) => console.warn('[CoffeeChat] 알림 이메일 전송 실패 (커피챗은 정상 처리됨):', err))
      }
      queryClient.invalidateQueries({ queryKey: coffeeChatKeys.all })
    },
  })
}
